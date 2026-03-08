import React, { useState, useRef, useEffect } from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Camera, X, CheckCircle2 } from 'lucide-react-native';
import { theme } from '../../theme';

const { width, height } = Dimensions.get('window');

// Wait for WebView initialization before sending messages
const INJECTED_JAVASCRIPT = `
  window.addEventListener('message', function(event) {
    if (event.data === 'START_CAMERA') {
      startCamera();
    }
  });
  true; // Required for React Native WebView
`;

const EXERCISES = [
    { id: 'bicep_curl', name: 'Bicep Curls (Right)' },
    { id: 'squat', name: 'Bodyweight Squats' },
    { id: 'press', name: 'Pressing Movements' },
    { id: 'pull', name: 'Pulling/Rowing Movements' },
    { id: 'hinge', name: 'Hinging Movements' },
    { id: 'hold', name: 'Static Core Holds' },
    { id: 'accessory_arm', name: 'Arm Isolation' },
    { id: 'accessory_leg', name: 'Leg Isolation' },
    { id: 'accessory_core', name: 'Core Movements' },
];

const WorkoutTrackingScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();

    // UI Navigation State
    const [isCameraActive, setIsCameraActive] = useState(false);

    const webViewRef = useRef(null);
    const [poses, setPoses] = useState([]);
    const [isTrackerReady, setIsTrackerReady] = useState(false);

    // Workout State Tracking
    const [activeExercise, setActiveExercise] = useState('bicep_curl');
    const [correctReps, setCorrectReps] = useState(0);
    const [incorrectReps, setIncorrectReps] = useState(0);

    // Set & Session Tracking
    const [targetSets, setTargetSets] = useState(0);
    const [targetReps, setTargetReps] = useState(0);
    const [currentSet, setCurrentSet] = useState(1);
    const [sessionHistory, setSessionHistory] = useState([]); // Stores { set: 1, perfect: 10, flawed: 2 }
    const [isWorkoutComplete, setIsWorkoutComplete] = useState(false);

    const [currentPhase, setCurrentPhase] = useState('down'); // 'down' or 'up'
    const [feedback, setFeedback] = useState('Stand in front of the camera');
    const [minAngleReached, setMinAngleReached] = useState(180); // Lowest angle reached in current rep

    // Prevent double-counting reps from 60fps camera feed
    const repCooldown = useRef(false);

    // Reset counters when switching exercises
    const switchExercise = (id, sets = 0, reps = 0) => {
        setActiveExercise(id);
        setCorrectReps(0);
        setIncorrectReps(0);
        setTargetSets(sets);
        setTargetReps(reps);
        setCurrentSet(1);
        setSessionHistory([]);
        setIsWorkoutComplete(false);
        setCurrentPhase('down');
        setFeedback('Ready. Begin exercise!');
        setMinAngleReached(180);
        repCooldown.current = false;
    };

    // Auto-Launch from Workout Plan Screen
    useEffect(() => {
        if (route.params?.autoStartExercise) {
            switchExercise(
                route.params.autoStartExercise,
                route.params.targetSets || 0,
                route.params.targetReps || 0
            );
            setIsCameraActive(true);

            // Clear params to avoid loop if user returns to this screen
            navigation.setParams({
                autoStartExercise: undefined,
                targetSets: undefined,
                targetReps: undefined
            });
        }
    }, [route.params?.autoStartExercise]);

    // Generic math function to calculate geometric angle between 3 points
    const calculateAngle = (a, b, c) => {
        const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
        let angle = Math.abs((radians * 180.0) / Math.PI);
        if (angle > 180.0) {
            angle = 360 - angle;
        }
        return angle;
    };

    // Helper to extract a named point safely
    const getPoint = (keypoints, name) => keypoints.find(k => k.name === name);

    // This HTML string is the entire brain of the AI
    // It runs locally inside the app's hidden browser
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
            body { margin: 0; padding: 0; background-color: #000; overflow: hidden; display: flex; justify-content: center; align-items: center; height: 100vh; }
            video { width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); }
            canvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; transform: scaleX(-1); pointer-events: none; }
            #loading { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #13EC5B; font-family: sans-serif; text-align: center; }
        </style>
        
        <!-- Load TensorFlow.js core and WebGL backend -->
        <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core@3.21.0"></script>
        <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-converter@3.21.0"></script>
        <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl@3.21.0"></script>
        <script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@2.1.3"></script>
    </head>
    <body>
        <div id="loading">
            <h2>Warming up AI...</h2>
            <p>Please wait.</p>
        </div>
        
        <video id="video" playsinline autoplay muted></video>
        <canvas id="output"></canvas>

        <script>
            let detector;
            let video;
            let canvas;
            let ctx;

            // --- STATE TRACKING ---
            window.currentPhase = 'down';
            window.minAngleReached = 180;
            window.repCooldown = false;

            // Wait for React Native to tell us to start
            function startCamera() {
                initEngine();
            }

            // --- REACT NATIVE BRIDGE ---
            function postMessageToRN(type, payload) {
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, ...payload }));
                }
            }

            // --- MATH HELPERS ---
            function calculateAngle(a, b, c) {
                const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
                let angle = Math.abs((radians * 180.0) / Math.PI);
                if (angle > 180.0) {
                    angle = 360 - angle;
                }
                return angle;
            }

            async function initEngine() {
                video = document.getElementById('video');
                canvas = document.getElementById('output');
                ctx = canvas.getContext('2d');
                
                try {
                    // Try to get fallback for older webviews if mediaDevices isn't present
                    const getUserMedia = navigator.mediaDevices?.getUserMedia || 
                                         navigator.webkitGetUserMedia || 
                                         navigator.mozGetUserMedia;

                    if (!getUserMedia) {
                        throw new Error('getUserMedia is not supported in this browser environment');
                    }

                    // 1. Get Camera Feed
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
                        audio: false
                    });
                    video.srcObject = stream;
                    
                    // Wait for video to be ready before firing
                    await new Promise((resolve) => {
                        video.onloadeddata = () => {
                            resolve(video);
                        };
                    });
                    
                    // Match canvas to video size
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;

                    // 2. Load MoveNet AI
                    await tf.setBackend('webgl');
                    await tf.ready();
                    detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
                        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
                        enableSmoothing: true
                    });
                    
                    document.getElementById('loading').style.display = 'none';
                    
                    // Tell React Native we are ready!
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'STATUS', message: 'READY' }));

                    // 3. Start Detection Loop
                    detectPose();
                } catch (error) {
                    postMessageToRN('ERROR', { message: error.message });
                    document.getElementById('loading').innerHTML = '<h2>Camera Error</h2><p>' + error.message + '</p>';
                }
            }

            // --- BICEP CURL LOGIC (Shoulder, Elbow, Wrist) ---
            function processBicepCurls(poses) {
                const shoulder = poses[0].keypoints.find(k => k.name === 'right_shoulder');
                const elbow = poses[0].keypoints.find(k => k.name === 'right_elbow');
                const wrist = poses[0].keypoints.find(k => k.name === 'right_wrist');

                if (shoulder?.score > 0.1 && elbow?.score > 0.1 && wrist?.score > 0.1) {
                    const angle = calculateAngle(shoulder, elbow, wrist);
                    postMessageToRN('DEBUG', { message: 'Bicep Angle: ' + Math.round(angle) });
                    
                    // Track the tightest angle (how far they curled up)
                    if (angle < window.minAngleReached) window.minAngleReached = angle;

                    // Arm straight down -> Down Phase
                    if (angle > 140) {
                        if (window.currentPhase === 'up' && !window.repCooldown) {
                            window.repCooldown = true;

                            // Arm has returned down. Was it a good rep?
                            if (window.minAngleReached < 60) {
                                postMessageToRN('REP_COMPLETED', { repQuality: 'perfect', feedback: 'Perfect Rep! Good squeeze.' });
                            } else {
                                // They started curling but didn't go all the way up
                                postMessageToRN('REP_COMPLETED', { repQuality: 'flawed', feedback: 'Incomplete range! Curl all the way up.' });
                            }

                            setTimeout(() => {
                                window.repCooldown = false;
                            }, 1000); // 1 second cooldown
                        }
                        window.currentPhase = 'down';
                        window.minAngleReached = 180; // Reset for next rep
                    }
                    // Arm has started curling up significantly -> Up Phase
                    // We set this trigger to < 120 so that even "half-curls" get registered as going "Up"
                    else if (angle < 120 && window.currentPhase === 'down') {
                        window.currentPhase = 'up';
                        postMessageToRN('FEEDBACK', { message: 'Curling up...' });
                    }
                    // Mid-curl / Transition zones
                    else if (angle >= 60 && angle <= 140) {
                        if (window.currentPhase === 'up') {
                            // They are in the 'Up' phase and are currently lowering the weight
                            postMessageToRN('FEEDBACK', { message: 'Lowering weight...' });
                        } else {
                            // They are in the 'Down' zone just starting to curl
                            postMessageToRN('FEEDBACK', { message: 'Keep curling...' });
                        }
                    }
                } else {
                    postMessageToRN('FEEDBACK', { message: 'Ensure right arm is fully visible' });
                }
            }

             // --- SQUAT LOGIC (Hip, Knee, Ankle) ---
            function processSquats(poses) {
                const hip = poses[0].keypoints.find(k => k.name === 'right_hip');
                const knee = poses[0].keypoints.find(k => k.name === 'right_knee');
                const ankle = poses[0].keypoints.find(k => k.name === 'right_ankle');

                if (hip?.score > 0.1 && knee?.score > 0.1 && ankle?.score > 0.1) {
                    const angle = calculateAngle(hip, knee, ankle);
                    window.currentAngle = angle;
                    
                    if (window.currentPhase === 'down' && angle > 160) {
                        if (window.minAngleReached < 140 && !window.repCooldown) {
                            window.repCooldown = true;
                            // Returning to standing. Evaluate the squat depth.
                            if (window.minAngleReached < 100) {
                                postMessageToRN('REP_COMPLETED', { repQuality: 'perfect', feedback: 'Great depth! Perfect Squat.' });
                            } else {
                                postMessageToRN('REP_COMPLETED', { repQuality: 'flawed', feedback: 'Too shallow! Squat lower next time.' });
                            }
                            setTimeout(() => { window.repCooldown = false; }, 1000);
                        }
                        window.currentPhase = 'up';
                        postMessageToRN('DEBUG', \`Squat Phase: UP, Angle: \${Math.round(angle)}\`);
                        window.minAngleReached = 180; // Reset for next rep
                    } else if (window.currentPhase === 'up' && angle < 140) {
                        window.currentPhase = 'down';
                        postMessageToRN('DEBUG', 'Squat Phase: DOWN - Rep Started');
                    }
                    
                    if (window.currentPhase === 'down') {
                        if (angle < window.minAngleReached) {
                            window.minAngleReached = angle;
                        }
                    }
                } else {
                    postMessageToRN('FEEDBACK', { message: 'Ensure full right leg is visible' });
                }
            }

            // --- PRESS LOGIC (Push-ups, Bench Press, Shoulder Press) ---
            // Tracks Elbow Angle (Shoulder, Elbow, Wrist)
            function processPress(poses) {
                const shoulder = poses[0].keypoints.find(k => k.name === 'right_shoulder');
                const elbow = poses[0].keypoints.find(k => k.name === 'right_elbow');
                const wrist = poses[0].keypoints.find(k => k.name === 'right_wrist');

                if (shoulder?.score > 0.1 && elbow?.score > 0.1 && wrist?.score > 0.1) {
                    const angle = calculateAngle(shoulder, elbow, wrist);
                    window.currentAngle = angle;
                    
                    // Down phase (eccentric press)
                    if (window.currentPhase === 'down' && angle > 150) {
                        if (window.minAngleReached < 130 && !window.repCooldown) {
                            window.repCooldown = true;
                            // Arms fully extended up. Was it a complete press?
                            if (window.minAngleReached < 70) {
                                postMessageToRN('REP_COMPLETED', { repQuality: 'perfect', feedback: 'Full lockout! Great press.' });
                            } else {
                                postMessageToRN('REP_COMPLETED', { repQuality: 'flawed', feedback: 'Push all the way up!' });
                            }
                            setTimeout(() => { window.repCooldown = false; }, 1000);
                        }
                        window.currentPhase = 'up'; // 'up' means extended here
                        window.minAngleReached = 180; // Reset for next rep
                        postMessageToRN('FEEDBACK', { message: 'Extending arm...' });
                    } else if (window.currentPhase === 'up' && angle < 130) {
                        window.currentPhase = 'down'; // 'down' means contracted
                        postMessageToRN('FEEDBACK', { message: 'Lowering weight...' });
                    }
                    
                    if (window.currentPhase === 'down') {
                        if (angle < window.minAngleReached) window.minAngleReached = angle;
                    }
                } else {
                    postMessageToRN('FEEDBACK', { message: 'Ensure right arm is fully visible' });
                }
            }

            // --- PULL LOGIC (Rows, Pulldowns) ---
            // Inverted Press Logic (Max Contraction at low angle)
            function processPull(poses) {
                const shoulder = poses[0].keypoints.find(k => k.name === 'right_shoulder');
                const elbow = poses[0].keypoints.find(k => k.name === 'right_elbow');
                const wrist = poses[0].keypoints.find(k => k.name === 'right_wrist');

                if (shoulder?.score > 0.1 && elbow?.score > 0.1 && wrist?.score > 0.1) {
                    const angle = calculateAngle(shoulder, elbow, wrist);
                    window.currentAngle = angle;
                    
                    // Out phase (eccentric pull/stretch)
                    if (window.currentPhase === 'up' && angle > 150) { // Returning to stretch
                        if (window.minAngleReached < 120 && !window.repCooldown) {
                            window.repCooldown = true;
                            // Arm fully extended (row completed)
                            if (window.minAngleReached < 80) {
                                postMessageToRN('REP_COMPLETED', { repQuality: 'perfect', feedback: 'Strong pull! Good stretch.' });
                            } else {
                                postMessageToRN('REP_COMPLETED', { repQuality: 'flawed', feedback: 'Pull further back.' });
                            }
                            setTimeout(() => { window.repCooldown = false; }, 1000);
                        }
                        window.currentPhase = 'down'; // 'down' means stretched
                        window.minAngleReached = 180; // Reset
                        postMessageToRN('FEEDBACK', { message: 'Stretching out...' });
                    } else if (window.currentPhase === 'down' && angle < 120) { // Starting pull
                        window.currentPhase = 'up'; // 'up' means contracted here
                        postMessageToRN('FEEDBACK', { message: 'Pulling back...' });
                    }
                    
                    if (window.currentPhase === 'up') { // During contraction phase
                        if (angle < window.minAngleReached) window.minAngleReached = angle;
                    }
                } else {
                    postMessageToRN('FEEDBACK', { message: 'Ensure right arm is fully visible' });
                }
            }

            // --- HINGE LOGIC (Deadlifts, RDLs) ---
            // Tracks Hip extension (Shoulder, Hip, Knee)
            function processHinge(poses) {
                const shoulder = poses[0].keypoints.find(k => k.name === 'right_shoulder');
                const hip = poses[0].keypoints.find(k => k.name === 'right_hip');
                const knee = poses[0].keypoints.find(k => k.name === 'right_knee');

                if (shoulder?.score > 0.1 && hip?.score > 0.1 && knee?.score > 0.1) {
                    const angle = calculateAngle(shoulder, hip, knee);
                    window.currentAngle = angle;
                    
                    if (window.currentPhase === 'down' && angle > 165) { // Standing upright
                        if (window.minAngleReached < 140 && !window.repCooldown) {
                            window.repCooldown = true;
                            // Return to top of deadlift / hinge
                            if (window.minAngleReached <= 110) {
                                postMessageToRN('REP_COMPLETED', { repQuality: 'perfect', feedback: 'Perfect hinge lockout.' });
                            } else {
                                postMessageToRN('REP_COMPLETED', { repQuality: 'flawed', feedback: 'Push hips further back, keep back straight.' });
                            }
                            setTimeout(() => { window.repCooldown = false; }, 1000);
                        }
                        window.currentPhase = 'up'; // Lockout
                        window.minAngleReached = 180; // Reset
                        postMessageToRN('FEEDBACK', { message: 'Standing tall...' });
                    } else if (window.currentPhase === 'up' && angle < 140) { // Hinging forward
                        window.currentPhase = 'down'; // Hinging
                        postMessageToRN('FEEDBACK', { message: 'Hinging forward...' });
                    }
                    
                    if (window.currentPhase === 'down') { // During hinge
                        if (angle < window.minAngleReached) window.minAngleReached = angle;
                    }
                } else {
                    postMessageToRN('FEEDBACK', { message: 'Ensure full side profile is visible' });
                }
            }

            // --- HOLD LOGIC (Planks & Core) ---
            // Timer based. Tracks upper body stability so it works from front angles.
            function processHold(poses) {
                const lShoulder = poses[0].keypoints.find(k => k.name === 'left_shoulder');
                const rShoulder = poses[0].keypoints.find(k => k.name === 'right_shoulder');
                const nose = poses[0].keypoints.find(k => k.name === 'nose');

                // We just need the upper body/face visible to start tracking a hold
                if ((nose?.score > 0.1) || (lShoulder?.score > 0.2 && rShoulder?.score > 0.2)) {
                    
                    // Hacky way to simulate hold time using the frame loop (approx 30fps)
                    if (!window.holdFrames) window.holdFrames = 0;
                    window.holdFrames++;
                    
                    if (window.holdFrames > 45) { // ~1.5 seconds of sustained presence
                         postMessageToRN('REP_COMPLETED', { repQuality: 'perfect', feedback: 'Hold it! Time added.' });
                         window.holdFrames = 0;
                    }
                    postMessageToRN('FEEDBACK', { message: 'Hold the position!' });
                    
                } else {
                    window.holdFrames = 0; // Reset counter if they leave frame
                    postMessageToRN('FEEDBACK', { message: 'Hold your form in camera view' });
                }
            }

            // --- ACCESSORY LOGIC (Generic) ---
            function processAccessory(poses, type) {
                // For accessories, fallback to simple bicep curl logic or generic movement tracking
                // Since this covers leg extensions/crunches, we'll use a generic proxy 
                // This could be expanded to check specific points for specific accessory types
                if (type === 'accessory_arm') {
                    processBicepCurls(poses); // Fallback currently
                } else if (type === 'accessory_leg') {
                    processSquats(poses); // Use squat logic as a proxy for leg movement
                } else if (type === 'accessory_core') {
                    processHold(poses); // Use hold logic as a proxy for core stability
                } else {
                    postMessageToRN('FEEDBACK', { message: 'Accessory exercise: No specific tracking yet.' });
                }
            }
            
            async function detectPose() {
                if (detector && video.readyState >= 2) {
                    try {
                        const poses = await detector.estimatePoses(video, {
                            maxPoses: 1,
                            flipHorizontal: false
                        });

                        // Send the data back up to the App
                        if (poses.length > 0) {
                            // Shrink payload to only what React Native needs to draw/calculate
                            const slimPoses = poses.map(p => ({
                                score: p.score,
                                keypoints: p.keypoints.filter(k => k.score > 0.1).map(k => ({
                                    name: k.name,
                                    x: k.x / video.videoWidth, // Normalize 0-1
                                    y: k.y / video.videoHeight,
                                    score: k.score
                                }))
                            }));
                            
                            postMessageToRN('POSE_DATA', { poses: slimPoses });
                            
                            // --- AI WORKOUT ENGINE ---
                            // Dispatcher for the 6 biomechanical movement families
                            if (window.activeExercise === 'bicep_curl') {
                                processBicepCurls(poses);
                            } else if (window.activeExercise === 'squat') {
                                processSquats(poses);
                            } else if (window.activeExercise === 'press') {
                                processPress(poses);
                            } else if (window.activeExercise === 'pull') {
                                processPull(poses);
                            } else if (window.activeExercise === 'hinge') {
                                processHinge(poses);
                            } else if (window.activeExercise === 'hold') {
                                processHold(poses);
                            } else if (window.activeExercise && window.activeExercise.startsWith('accessory')) {
                                processAccessory(poses, window.activeExercise);
                            }
                            
                            drawSkeleton(poses[0]);
                        }
                    } catch (e) {
                        // ignore dropped frames
                    }
                }
                
                // Blast through frames as fast as WebGL allows
                requestAnimationFrame(detectPose);
            }
            
            // Draw lines inside the webview (faster than React Native drawing)
            function drawSkeleton(pose) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                const kps = pose.keypoints;
                
                // Draw dots for high confidence points
                ctx.fillStyle = '#13EC5B';
                kps.forEach(kp => {
                    if (kp.score > 0.1) {
                        ctx.beginPath();
                        ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
                        ctx.fill();
                    }
                });
            }
        </script>
    </body>
    </html>
    `;

    const handleWebViewMessage = (event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);

            if (data.type === 'STATUS' && data.message === 'READY') {
                setIsTrackerReady(true);
            }
            else if (data.type === 'POSE_DATA') {
                const currentPoses = data.poses;
                setPoses(currentPoses);
            }
            else if (data.type === 'REP_COMPLETED') {
                if (!repCooldown.current) {
                    repCooldown.current = true;

                    let newCorrect = correctReps;
                    let newIncorrect = incorrectReps;

                    if (data.repQuality === 'perfect') {
                        newCorrect++;
                        setCorrectReps(newCorrect);
                    } else {
                        newIncorrect++;
                        setIncorrectReps(newIncorrect);
                    }
                    setFeedback(data.feedback);

                    // Check if Set is Complete
                    if (targetReps > 0 && (newCorrect + newIncorrect) >= targetReps) {
                        const completedSetData = { set: currentSet, perfect: newCorrect, flawed: newIncorrect };
                        const updatedHistory = [...sessionHistory, completedSetData];
                        setSessionHistory(updatedHistory);

                        if (currentSet < targetSets) {
                            // Move to next set
                            setTimeout(() => {
                                setCorrectReps(0);
                                setIncorrectReps(0);
                                setCurrentSet(prev => prev + 1);
                                setFeedback(`Set ${currentSet} complete! Prepare for Set ${currentSet + 1}`);
                            }, 1500);
                        } else {
                            // Workout Finished
                            setTimeout(() => {
                                setIsWorkoutComplete(true);
                                handleCloseCamera();
                            }, 1500);
                        }
                    }

                    setTimeout(() => { repCooldown.current = false; }, 1000);
                }
            }
            else if (data.type === 'FEEDBACK') {
                setFeedback(data.message);
            }
            else if (data.type === 'ERROR') {
                console.error("WebView Camera Error:", data.message);
            }
            else if (data.type === 'DEBUG') {
                console.log("WebView Debug:", data.message);
            }
        } catch (e) {
            console.log("Failed to parse WebView exact message");
        }
    };
    // (Tracking Intelligence runs locally inside the WebView)

    // Close Camera UI Sequence
    const handleCloseCamera = () => {
        setIsCameraActive(false);
        setIsTrackerReady(false);
        setPoses([]);
    };

    // RENDERS THE IDLE MENU SCREEN
    if (!isCameraActive) {
        return (
            <SafeAreaView style={styles.idleContainer} edges={['top']}>
                <ScrollView contentContainerStyle={styles.idleContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.iconCircle}>
                        <Camera size={48} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.idleTitle}>Live Tracking</Text>
                    <Text style={styles.idleSubtitle}>
                        Your AI Form Coach is ready. Prop your phone against a wall and stand back.
                    </Text>

                    <TouchableOpacity
                        style={styles.openButton}
                        onPress={() => setIsCameraActive(true)}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.openButtonText}>Open Live Tracker</Text>
                    </TouchableOpacity>

                    {/* Stats from last session if available */}
                    {(sessionHistory.length > 0) && (
                        <View style={styles.lastSessionContainer}>
                            <Text style={styles.lastSessionTitle}>
                                {isWorkoutComplete ? 'Workout Summary' : 'Last Session Summary'}
                            </Text>
                            <Text style={styles.summaryExerciseName}>
                                {EXERCISES.find(e => e.id === activeExercise)?.name}
                            </Text>

                            <View style={styles.historyList}>
                                {sessionHistory.map((item, idx) => (
                                    <View key={idx} style={styles.historyRow}>
                                        <Text style={styles.historySetLabel}>Set {item.set}</Text>
                                        <View style={styles.historyStats}>
                                            <Text style={styles.historyPerfect}>{item.perfect} Perfect</Text>
                                            <Text style={styles.historyFlawed}>{item.flawed} Flawed</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.totalStatsRow}>
                                <View style={styles.statBox}>
                                    <Text style={styles.statValueGreen}>
                                        {sessionHistory.reduce((acc, curr) => acc + curr.perfect, 0)}
                                    </Text>
                                    <Text style={styles.statLabel}>Total Perfect</Text>
                                </View>
                                <View style={styles.statBox}>
                                    <Text style={styles.statValueRed}>
                                        {sessionHistory.reduce((acc, curr) => acc + curr.flawed, 0)}
                                    </Text>
                                    <Text style={styles.statLabel}>Total Flawed</Text>
                                </View>
                            </View>
                        </View>
                    )}
                    <View style={{ height: 100 }} />
                </ScrollView>
            </SafeAreaView>
        );
    }

    // RENDERS THE ACTIVE AI TRACKER FULLSCREEN
    return (
        <SafeAreaView style={styles.wrapper} edges={['top']}>
            {/* Top Minimal Header over Camera */}
            <View style={styles.cameraHeader}>
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{isTrackerReady ? "AI ACTIVE" : "LOADING AI"}</Text>
                </View>
                <TouchableOpacity onPress={handleCloseCamera} style={styles.closeButton}>
                    <X size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            {/* Exercise Selector */}
            <View style={styles.exerciseSelectorContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.exerciseSelector}>
                    {EXERCISES.map(ex => (
                        <TouchableOpacity
                            key={ex.id}
                            style={[
                                styles.exercisePill,
                                activeExercise === ex.id && styles.exercisePillActive
                            ]}
                            onPress={() => switchExercise(ex.id)}
                        >
                            <Text style={[
                                styles.exercisePillText,
                                activeExercise === ex.id && styles.exercisePillTextActive
                            ]}>
                                {ex.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <View style={styles.cameraContainer}>
                {/* 
                   We use mediaPlaybackRequiresUserAction={false} and allowsInlineMediaPlayback 
                   so the camera can auto-start inside the hidden webview without forcing the user
                   to tap a play button first.
                */}
                <WebView
                    ref={webViewRef}
                    originWhitelist={['*']}
                    /* 
                       CRITICAL for Android: Load HTML with a base URL of 'https://localhost' 
                       Android WebViews block mediaDevices.getUserMedia() if the origin is simply 'data:text/html'
                    */
                    source={{ html: htmlContent, baseUrl: 'https://localhost' }}
                    style={styles.webView}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    mediaPlaybackRequiresUserAction={false}
                    allowsInlineMediaPlayback={true}
                    mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"
                    onMessage={handleWebViewMessage}
                    injectedJavaScript={`
                        ${INJECTED_JAVASCRIPT}
                        window.activeExercise = '${activeExercise}';
                        true;
                    `}
                    onLoadEnd={() => {
                        // Kick off the camera once the basic HTML shell is loaded
                        webViewRef.current?.injectJavaScript("startCamera(); true;");
                    }}
                />

                {/* Workout HUD Overlay */}
                <View style={styles.workoutHud}>
                    {/* Correct Reps */}
                    <View style={styles.repContainer}>
                        <Text style={styles.repCount}>{correctReps}</Text>
                        <Text style={styles.repLabel}>Perfect</Text>
                    </View>

                    {/* Incorrect Reps */}
                    <View style={[styles.repContainer, styles.repContainerBad]}>
                        <Text style={[styles.repCount, styles.repCountBad]}>{incorrectReps}</Text>
                        <Text style={styles.repLabel}>Flawed</Text>
                    </View>

                    <View style={styles.feedbackContainer}>
                        <Text style={styles.exerciseName}>
                            {EXERCISES.find(e => e.id === activeExercise)?.name}
                        </Text>
                        {targetSets > 0 && (
                            <Text style={styles.goalText}>
                                Set {currentSet} of {targetSets} • Goal: {targetReps} Reps
                            </Text>
                        )}
                        <Text style={styles.feedbackText}>{feedback}</Text>
                    </View>

                    {/* Quick Done Button */}
                    <TouchableOpacity style={styles.doneBtn} onPress={handleCloseCamera}>
                        <CheckCircle2 color="#FFF" size={24} />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: '#000',
    },
    idleContainer: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    idleContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(19, 236, 91, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(19, 236, 91, 0.3)',
    },
    idleTitle: {
        color: '#FFF',
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    idleSubtitle: {
        color: theme.colors.textMuted,
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 24,
    },
    openButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 40,
        paddingVertical: 16,
        borderRadius: 30,
        width: '100%',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    openButtonText: {
        color: '#000',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    lastSessionContainer: {
        marginTop: 60,
        width: '100%',
        backgroundColor: '#111',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#222',
    },
    lastSessionTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    totalStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#222',
    },
    summaryExerciseName: {
        color: theme.colors.primary,
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    historyList: {
        maxHeight: 200,
        marginBottom: 10,
    },
    historyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    historySetLabel: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    historyStats: {
        flexDirection: 'row',
        gap: 15,
    },
    historyPerfect: {
        color: theme.colors.primary,
        fontSize: 13,
        fontWeight: 'bold',
    },
    historyFlawed: {
        color: '#FF6B6B',
        fontSize: 13,
        fontWeight: 'bold',
    },
    goalText: {
        color: theme.colors.primary,
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    statBox: {
        alignItems: 'center',
    },
    statValueGreen: {
        color: theme.colors.primary,
        fontSize: 28,
        fontWeight: '900',
    },
    statValueRed: {
        color: '#FF6B6B',
        fontSize: 28,
        fontWeight: '900',
    },
    statLabel: {
        color: theme.colors.textMuted,
        fontSize: 12,
        marginTop: 4,
    },

    // --- Camera Active Styles ---
    cameraHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 15,
        backgroundColor: '#111',
        zIndex: 10,
    },
    closeButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
    },
    statusBadge: {
        backgroundColor: 'rgba(19, 236, 91, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.primary,
    },
    statusText: {
        color: theme.colors.primary,
        fontSize: 10,
        fontWeight: 'bold',
    },
    exerciseSelectorContainer: {
        backgroundColor: '#111',
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
        zIndex: 10,
    },
    exerciseSelector: {
        paddingHorizontal: 20,
        gap: 10,
    },
    exercisePill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#222',
        borderWidth: 1,
        borderColor: '#333',
    },
    exercisePillActive: {
        backgroundColor: 'rgba(19, 236, 91, 0.15)',
        borderColor: theme.colors.primary,
    },
    exercisePillText: {
        color: '#888',
        fontWeight: 'bold',
    },
    exercisePillTextActive: {
        color: theme.colors.primary,
    },
    cameraContainer: {
        flex: 1,
        width: '100%',
        position: 'relative',
        backgroundColor: '#111',
    },
    webView: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    workoutHud: {
        position: 'absolute',
        bottom: 90, // Increased to lift above the bottom navigation bar
        left: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.85)',
        padding: 15,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)'
    },
    repContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 60,
        height: 60,
        backgroundColor: 'rgba(19, 236, 91, 0.15)',
        borderRadius: 30,
        borderWidth: 2,
        borderColor: theme.colors.primary,
        marginRight: 10
    },
    repContainerBad: {
        backgroundColor: 'rgba(255, 107, 107, 0.15)',
        borderColor: '#FF6B6B',
        marginRight: 15
    },
    repCount: {
        color: theme.colors.primary,
        fontSize: 22,
        fontWeight: '900',
    },
    repCountBad: {
        color: '#FF6B6B',
    },
    repLabel: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '600',
        marginTop: -2
    },
    feedbackContainer: {
        flex: 1,
    },
    exerciseName: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    feedbackText: {
        color: theme.colors.textMuted,
        fontSize: 13,
        fontWeight: '500',
    },
    doneBtn: {
        backgroundColor: theme.colors.primary,
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    }
});

export default WorkoutTrackingScreen;
