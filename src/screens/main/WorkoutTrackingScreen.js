import React, { useState, useRef, useEffect } from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Camera as ExpoCamera } from 'expo-camera';
import { Camera, X, CheckCircle2, AlertCircle } from 'lucide-react-native';
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
    { id: 'bicep_curl', name: 'Bicep Curls' },
    { id: 'squat', name: 'Bodyweight Squats' },
    { id: 'press', name: 'Pressing Movements' },
    { id: 'pull', name: 'Pulling/Rowing Movements' },
    { id: 'hinge', name: 'Hinging Movements' },
    { id: 'hold', name: 'Static Core Holds' },
    { id: 'plank', name: 'Plank' },
    { id: 'high_knees', name: 'High Knees' },
    { id: 'jumping_jacks', name: 'Jumping Jacks' },
    { id: 'accessory_arm', name: 'Arm Isolation' },
    { id: 'accessory_leg', name: 'Leg Isolation' },
    { id: 'accessory_core', name: 'Core Movements' },
];

const WorkoutTrackingScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();

    // UI Navigation State
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [hasPermission, setHasPermission] = useState(null);

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
    const [showLargeWarning, setShowLargeWarning] = useState(false);
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

    // Auto-Launch and Permission Handling
    useEffect(() => {
        if (isCameraActive) {
            (async () => {
                const { status } = await ExpoCamera.requestCameraPermissionsAsync();
                setHasPermission(status === 'granted');
                if (status !== 'granted') {
                    setIsCameraActive(false);
                    alert("Camera permission is required to track your workout.");
                }
            })();
        }
    }, [isCameraActive]);

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

            // --- BILATERAL SIDE SELECTOR ---
            // Returns the 3 keypoints from whichever side (left or right) is more visible
            function getBestSide(poses, pointNames) {
                const right = pointNames.map(n => poses[0].keypoints.find(k => k.name === 'right_' + n));
                const left  = pointNames.map(n => poses[0].keypoints.find(k => k.name === 'left_' + n));

                const rScore = right.reduce((sum, p) => sum + (p?.score || 0), 0) / right.length;
                const lScore = left.reduce((sum, p) => sum + (p?.score || 0), 0) / left.length;

                const rValid = right.every(p => p?.score > 0.4);
                const lValid = left.every(p => p?.score > 0.4);

                if (rValid && lValid) return rScore >= lScore ? right : left;
                if (rValid) return right;
                if (lValid) return left;
                return null;
            }

            // --- ORIENTATION DETECTION ---
            function checkOrientation(poses) {
                const lShoulder = poses[0].keypoints.find(k => k.name === 'left_shoulder');
                const rShoulder = poses[0].keypoints.find(k => k.name === 'right_shoulder');
                const lAnkle = poses[0].keypoints.find(k => k.name === 'left_ankle');
                const rAnkle = poses[0].keypoints.find(k => k.name === 'right_ankle');
                const nose = poses[0].keypoints.find(k => k.name === 'nose');

                if (lShoulder?.score > 0.3 && rShoulder?.score > 0.3) {
                    const shoulderWidth = Math.abs(lShoulder.x - rShoulder.x);
                    
                    // Use body height as a normalizer (Nose to Ankle)
                    const refPoint = lAnkle?.score > 0.3 ? lAnkle : (rAnkle?.score > 0.3 ? rAnkle : null);
                    if (refPoint && nose) {
                        const bodyHeight = Math.abs(nose.y - refPoint.y);
                        const ratio = shoulderWidth / bodyHeight;
                        postMessageToRN('DEBUG', { message: 'Orientation Debug - Ratio: ' + ratio.toFixed(2) + ', S-Width: ' + shoulderWidth.toFixed(2) + ', B-Height: ' + bodyHeight.toFixed(2) });
                        
                        // For a front-facing person, shoulder width is ~20-25% of body height (ratio ~0.25).
                        // For a side-profile person, shoulder width is much smaller (ratio < 0.12).
                        // We use 0.18 as the threshold.
                        return ratio < 0.18; 
                    }
                    
                    // Fallback: If ankles aren't visible, normalize shoulder width using the video's actual width
                    // Since MoveNet returns absolute pixels (e.g. 150px), we must convert it to a percentage (150/640)
                    const normalizedShoulderWidth = shoulderWidth / video.videoWidth;
                    postMessageToRN('DEBUG', { message: 'Orientation Fallback - Normalized Width: ' + normalizedShoulderWidth.toFixed(2) });
                    
                    return normalizedShoulderWidth < 0.20; // Needs to take up less than 20% of the screen width to be a side profile
                }
                return true; // Default to valid if points missing
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
                    // Use the specific implementation that we found available
                    let stream;
                    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                        stream = await navigator.mediaDevices.getUserMedia({
                            video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
                            audio: false
                        });
                    } else {
                        stream = await new Promise((resolve, reject) => {
                            getUserMedia.call(navigator, {
                                video: { facingMode: 'user' },
                                audio: false
                            }, resolve, reject);
                        });
                    }
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
                    try {
                        await tf.setBackend('webgl');
                    } catch (e) {
                        console.log("WebGL not supported, falling back to CPU");
                        await tf.setBackend('cpu');
                    }
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
                const side = getBestSide(poses, ['shoulder', 'elbow', 'wrist']);

                if (side) {
                    const [shoulder, elbow, wrist] = side;
                    // --- ORIENTATION GUARD ---
                    const isValidOrientation = checkOrientation(poses);
                    if (!isValidOrientation) {
                        postMessageToRN('FEEDBACK', { message: '⚠️ Turn sideways for better tracking' });
                        window.hadOrientationWarning = true;
                        return; // Halt rep processing until turned
                    } else if (window.hadOrientationWarning) {
                        // Clear warning immediately once they turn
                        postMessageToRN('FEEDBACK', { message: 'Ready. Begin exercise!' });
                        window.hadOrientationWarning = false;
                    }

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
                    postMessageToRN('FEEDBACK', { message: 'Ensure your arm is fully visible' });
                }
            }

             // --- SQUAT LOGIC (Hip, Knee, Ankle) ---
            function processSquats(poses) {
                // --- ORIENTATION GUARD ---
                // We perform this first because if they face forward, getBestSide often fails 
                // to find a 'good' side since knee angles are occluded.
                const isValidOrientation = checkOrientation(poses);
                if (!isValidOrientation) {
                    postMessageToRN('FEEDBACK', { message: '⚠️ Turn sideways so I can see depth!' });
                    window.hadOrientationWarning = true;
                    return; // Halt rep processing until turned
                } else if (window.hadOrientationWarning) {
                    // Clear warning immediately once they turn
                    postMessageToRN('FEEDBACK', { message: '✅ Perfect side profile. Start squatting.' });
                    window.hadOrientationWarning = false;
                }

                const side = getBestSide(poses, ['hip', 'knee', 'ankle']);

                if (side) {
                    const [hip, knee, ankle] = side;

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
                        postMessageToRN('DEBUG', 'Squat Phase: UP, Angle: ' + Math.round(angle));
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
                    // Only show this if orientation is correct, but joints are occluded/off-screen
                    if (!window.hadOrientationWarning) {
                         postMessageToRN('FEEDBACK', { message: 'Ensure your full leg is visible' });
                    }
                }
            }

            // --- PUSH-UP LOGIC (Shoulder, Elbow, Wrist) ---
            function processPushups(poses) {
                const side = getBestSide(poses, ['shoulder', 'elbow', 'wrist']);

                if (side) {
                    const [shoulder, elbow, wrist] = side;

                    // --- ORIENTATION GUARD ---
                    // Pushups require a side profile to see the elbow angle clearly
                    const isValidOrientation = checkOrientation(poses);
                    if (!isValidOrientation) {
                        postMessageToRN('FEEDBACK', { message: '⚠️ Turn sideways so I can see your form!' });
                        window.hadOrientationWarning = true;
                        return;
                    } else if (window.hadOrientationWarning) {
                        postMessageToRN('FEEDBACK', { message: '✅ Perfect profile. Start pushing!' });
                        window.hadOrientationWarning = false;
                    }

                    const angle = calculateAngle(shoulder, elbow, wrist);
                    if (!window.minAngleReached) window.minAngleReached = 180;
                    
                    // Locked out -> Up phase
                    if (window.currentPhase === 'down' && angle > 150) {
                        if (window.minAngleReached < 130 && !window.repCooldown) {
                            window.repCooldown = true;
                            // Check depth
                            if (window.minAngleReached < 70) {
                                postMessageToRN('REP_COMPLETED', { repQuality: 'perfect', feedback: 'Perfect depth! Full extension.' });
                            } else {
                                postMessageToRN('REP_COMPLETED', { repQuality: 'flawed', feedback: 'Lower your chest more for full range!' });
                            }
                            setTimeout(() => { window.repCooldown = false; }, 1000);
                        }
                        window.currentPhase = 'up'; 
                        window.minAngleReached = 180; 
                        postMessageToRN('FEEDBACK', { message: 'Straighten arms...' });
                    } else if (window.currentPhase === 'up' && angle < 130) {
                        window.currentPhase = 'down';
                        postMessageToRN('FEEDBACK', { message: 'Lowering chest...' });
                    }
                    
                    if (window.currentPhase === 'down') {
                        if (angle < window.minAngleReached) window.minAngleReached = angle;
                    }
                } else {
                    if (!window.hadOrientationWarning) postMessageToRN('FEEDBACK', { message: 'Ensure your arm is visible' });
                }
            }

            // --- KNEE PUSH-UP LOGIC (Shoulder, Elbow, Wrist) ---
            function processKneePushups(poses) {
                // Logic is similar to pushups but we might adjust thresholds if needed
                processPushups(poses);
            }

            // --- BARBELL BENCH PRESS LOGIC (Shoulder, Elbow, Wrist) ---
            function processBarbellBench(poses) {
                const side = getBestSide(poses, ['shoulder', 'elbow', 'wrist']);

                if (side) {
                    const [shoulder, elbow, wrist] = side;

                    // --- ORIENTATION GUARD ---
                    const isValidOrientation = checkOrientation(poses);
                    if (!isValidOrientation) {
                        postMessageToRN('FEEDBACK', { message: '⚠️ Side profile is best for bench press!' });
                        window.hadOrientationWarning = true;
                        return;
                    } else if (window.hadOrientationWarning) {
                        postMessageToRN('FEEDBACK', { message: '✅ Ready. Start the press!' });
                        window.hadOrientationWarning = false;
                    }

                    const angle = calculateAngle(shoulder, elbow, wrist);
                    if (!window.minAngleReached) window.minAngleReached = 180;
                    
                    if (window.currentPhase === 'down' && angle > 150) {
                        if (window.minAngleReached < 130 && !window.repCooldown) {
                            window.repCooldown = true;
                            if (window.minAngleReached < 75) {
                                postMessageToRN('REP_COMPLETED', { repQuality: 'perfect', feedback: 'Great depth! Full lockout.' });
                            } else {
                                postMessageToRN('REP_COMPLETED', { repQuality: 'flawed', feedback: 'Bring the bar closer to your chest!' });
                            }
                            setTimeout(() => { window.repCooldown = false; }, 1000);
                        }
                        window.currentPhase = 'up'; 
                        window.minAngleReached = 180; 
                        postMessageToRN('FEEDBACK', { message: 'Pushing up...' });
                    } else if (window.currentPhase === 'up' && angle < 130) {
                        window.currentPhase = 'down';
                        postMessageToRN('FEEDBACK', { message: 'Lowering bar...' });
                    }
                    
                    if (window.currentPhase === 'down') {
                        if (angle < window.minAngleReached) window.minAngleReached = angle;
                    }
                } else {
                    if (!window.hadOrientationWarning) postMessageToRN('FEEDBACK', { message: 'Ensure your side is visible to the camera' });
                }
            }

            // --- DUMBBELL BENCH PRESS LOGIC ---
            function processDumbbellBench(poses) {
                // Logic is very similar to barbell bench
                processBarbellBench(poses);
            }

            // --- INCLINE DUMBBELL PRESS LOGIC ---
            function processInclineBench(poses) {
                const side = getBestSide(poses, ['shoulder', 'elbow', 'wrist']);

                if (side) {
                    const [shoulder, elbow, wrist] = side;

                    // --- ORIENTATION GUARD ---
                    const isValidOrientation = checkOrientation(poses);
                    if (!isValidOrientation) {
                        postMessageToRN('FEEDBACK', { message: '⚠️ Turn sideways for incline press tracking!' });
                        window.hadOrientationWarning = true;
                        return;
                    } else if (window.hadOrientationWarning) {
                        postMessageToRN('FEEDBACK', { message: '✅ Perfect profile. Start pressing.' });
                        window.hadOrientationWarning = false;
                    }

                    const angle = calculateAngle(shoulder, elbow, wrist);
                    if (!window.minAngleReached) window.minAngleReached = 180;
                    
                    if (window.currentPhase === 'down' && angle > 155) {
                        if (window.minAngleReached < 130 && !window.repCooldown) {
                            window.repCooldown = true;
                            if (window.minAngleReached < 85) {
                                postMessageToRN('REP_COMPLETED', { repQuality: 'perfect', feedback: 'Solid incline press!' });
                            } else {
                                postMessageToRN('REP_COMPLETED', { repQuality: 'flawed', feedback: 'Press for more depth!' });
                            }
                            setTimeout(() => { window.repCooldown = false; }, 1000);
                        }
                        window.currentPhase = 'up'; 
                        window.minAngleReached = 180; 
                        postMessageToRN('FEEDBACK', { message: 'Full lockout!' });
                    } else if (window.currentPhase === 'up' && angle < 125) {
                        window.currentPhase = 'down';
                        postMessageToRN('FEEDBACK', { message: 'Lowering...' });
                    }
                    
                    if (window.currentPhase === 'down') {
                        if (angle < window.minAngleReached) window.minAngleReached = angle;
                    }
                } else {
                    if (!window.hadOrientationWarning) postMessageToRN('FEEDBACK', { message: 'Ensure your side is visible' });
                }
            }

            // --- DUMBBELL SHOULDER PRESS LOGIC (Hip, Shoulder, Elbow) ---
            function processShoulderPress(poses) {
                const lShoulder = poses[0].keypoints.find(k => k.name === 'left_shoulder');
                const lHip = poses[0].keypoints.find(k => k.name === 'left_hip');
                const lElbow = poses[0].keypoints.find(k => k.name === 'left_elbow');
                const rShoulder = poses[0].keypoints.find(k => k.name === 'right_shoulder');
                const rHip = poses[0].keypoints.find(k => k.name === 'right_hip');
                const rElbow = poses[0].keypoints.find(k => k.name === 'right_elbow');

                // --- ORIENTATION GUARD ---
                // Shoulder press needs a front or diagonal view to track both arms overhead.
                if (lShoulder?.score < 0.3 || rShoulder?.score < 0.3 || lHip?.score < 0.3 || rHip?.score < 0.3) {
                    postMessageToRN('FEEDBACK', { message: '⚠️ Face the camera to track shoulder press!' });
                    window.hadOrientationWarning = true;
                    return; // Halt rep processing until turned
                } else if (window.hadOrientationWarning) {
                    postMessageToRN('FEEDBACK', { message: '✅ Perfect angle. Start pressing.' });
                    window.hadOrientationWarning = false;
                }

                // Determine which arm to track based on better visibility
                let activeSide = null;
                if (rElbow?.score >= lElbow?.score && rElbow?.score > 0.4) {
                     activeSide = [rHip, rShoulder, rElbow]; // Angle at shoulder joint
                } else if (lElbow?.score > 0.4) {
                     activeSide = [lHip, lShoulder, lElbow];
                }

                if (activeSide) {
                    const [hip, shoulder, elbow] = activeSide;
                    const angle = calculateAngle(hip, shoulder, elbow); // Tracks shoulder abduction
                    
                    if (!window.maxAngleReached) window.maxAngleReached = 0;
                    
                    // Arms extended up -> Max angle reached this rep
                    if (angle > window.maxAngleReached) {
                         window.maxAngleReached = angle;
                    }

                    // Weights at shoulders -> Down position
                    if (angle < 60) {
                        if (window.currentPhase === 'up' && !window.repCooldown) {
                            window.repCooldown = true;
                            // Check max extension (arms overhead)
                            if (window.maxAngleReached > 150) {
                                postMessageToRN('REP_COMPLETED', { repQuality: 'perfect', feedback: 'Great overhead press!' });
                            } else {
                                postMessageToRN('REP_COMPLETED', { repQuality: 'flawed', feedback: 'Extend your arms fully overhead!' });
                            }
                            setTimeout(() => { window.repCooldown = false; }, 1000);
                        }
                        window.currentPhase = 'down';
                        window.maxAngleReached = 0; // Reset
                        postMessageToRN('FEEDBACK', { message: 'Weights at shoulders...' });
                    } 
                    // Pushing up -> Up phase
                    else if (angle > 90 && window.currentPhase === 'down') {
                        window.currentPhase = 'up';
                        postMessageToRN('FEEDBACK', { message: 'Pushing overhead...' });
                    }
                    else if (angle >= 60 && angle <= 90) {
                         postMessageToRN('FEEDBACK', { message: window.currentPhase === 'up' ? 'Reaching up...' : 'Lowering weights...' });
                    }
                } else {
                    if (!window.hadOrientationWarning) postMessageToRN('FEEDBACK', { message: 'Ensure your upper body is visible' });
                }
            }

            // --- LAT PULLDOWN LOGIC (Shoulder, Elbow, Wrist) ---
            function processLatPulldown(poses) {
                const side = getBestSide(poses, ['shoulder', 'elbow', 'wrist']);

                if (side) {
                    const [shoulder, elbow, wrist] = side;
                    
                    // --- ORIENTATION GUARD ---
                    const isValidOrientation = checkOrientation(poses);
                    if (!isValidOrientation) {
                        postMessageToRN('FEEDBACK', { message: '⚠️ Turn sideways for better tracking!' });
                        window.hadOrientationWarning = true;
                        return;
                    } else if (window.hadOrientationWarning) {
                        postMessageToRN('FEEDBACK', { message: 'Ready. Begin pulldowns!' });
                        window.hadOrientationWarning = false;
                    }

                    const angle = calculateAngle(shoulder, elbow, wrist);
                    
                    if (!window.minAngleReached) window.minAngleReached = 180;
                    
                    if (window.currentPhase === 'up') {
                        if (angle < window.minAngleReached) window.minAngleReached = angle;
                    }

                    // Arms extended UP -> Down Phase (Stretch)
                    if (angle > 140) {
                        if (window.currentPhase === 'up' && !window.repCooldown) {
                            window.repCooldown = true;
                            // Check max contraction (how far pulling down)
                            if (window.minAngleReached < 70) {
                                postMessageToRN('REP_COMPLETED', { repQuality: 'perfect', feedback: 'Great pull! Full contraction.' });
                            } else {
                                postMessageToRN('REP_COMPLETED', { repQuality: 'flawed', feedback: 'Pull the bar further down to your chest!' });
                            }
                            setTimeout(() => { window.repCooldown = false; }, 1000);
                        }
                        window.currentPhase = 'down'; // 'down' means stretched UP
                        window.minAngleReached = 180; 
                        postMessageToRN('FEEDBACK', { message: 'Reaching up...' });
                    } 
                    // Pulling the bar down -> Up Phase (Contraction)
                    else if (angle < 110 && window.currentPhase === 'down') {
                        window.currentPhase = 'up'; // 'up' means pulling down/contracting
                        postMessageToRN('FEEDBACK', { message: 'Pulling down...' });
                    }
                    else if (angle >= 70 && angle <= 110) {
                         postMessageToRN('FEEDBACK', { message: window.currentPhase === 'up' ? 'Squeezing...' : 'Letting bar up...' });
                    }
                } else {
                    if (!window.hadOrientationWarning) postMessageToRN('FEEDBACK', { message: 'Ensure your arms are visible' });
                }
            }

            // --- SEATED CABLE ROW LOGIC (Shoulder, Elbow, Wrist) ---
            function processCableRows(poses) {
                const side = getBestSide(poses, ['shoulder', 'elbow', 'wrist']);

                if (side) {
                    const [shoulder, elbow, wrist] = side;

                    // --- ORIENTATION GUARD ---
                    const isValidOrientation = checkOrientation(poses);
                    if (!isValidOrientation) {
                        postMessageToRN('FEEDBACK', { message: '⚠️ Turn sideways to track rows!' });
                        window.hadOrientationWarning = true;
                        return;
                    } else if (window.hadOrientationWarning) {
                        postMessageToRN('FEEDBACK', { message: '✅ Good angle. Start rowing.' });
                        window.hadOrientationWarning = false;
                    }

                    const angle = calculateAngle(shoulder, elbow, wrist);
                    if (!window.minAngleReached) window.minAngleReached = 180;
                    
                    if (window.currentPhase === 'up') {
                        if (angle < window.minAngleReached) window.minAngleReached = angle;
                    }
                    
                    // Arms extended forward -> Down Phase (Stretch)
                    if (angle > 150) { 
                        if (window.currentPhase === 'up' && !window.repCooldown) {
                            window.repCooldown = true;
                            // To get a perfect score, elbows bend strongly (< 70)
                            if (window.minAngleReached < 70) {
                                postMessageToRN('REP_COMPLETED', { repQuality: 'perfect', feedback: 'Perfect rep! Strong squeeze.' });
                            } else {
                                postMessageToRN('REP_COMPLETED', { repQuality: 'flawed', feedback: 'Pull closer to your torso!' });
                            }
                            setTimeout(() => { window.repCooldown = false; }, 1000);
                        }
                        window.currentPhase = 'down'; 
                        window.minAngleReached = 180; 
                        postMessageToRN('FEEDBACK', { message: 'Stretching forward...' });
                    } 
                    // Pulling motion -> Up Phase (Contraction)
                    else if (angle < 120 && window.currentPhase === 'down') { 
                        window.currentPhase = 'up'; 
                        postMessageToRN('FEEDBACK', { message: 'Rowing back...' });
                    }
                    else if (angle >= 70 && angle <= 120) {
                        postMessageToRN('FEEDBACK', { message: window.currentPhase === 'up' ? 'Squeeze back...' : 'Releasing weight...' });
                    }
                } else {
                    if (!window.hadOrientationWarning) postMessageToRN('FEEDBACK', { message: 'Ensure your arm is fully visible' });
                }
            }

            // --- DUMBBELL ROW LOGIC (Shoulder, Hip, Elbow) ---
            function processDumbbellRow(poses) {
                // Tracking upper arm relative to body instead of just elbow joint
                const side = getBestSide(poses, ['hip', 'shoulder', 'elbow']);

                if (side) {
                    const [hip, shoulder, elbow] = side;

                    const isValidOrientation = checkOrientation(poses);
                    if (!isValidOrientation) {
                        postMessageToRN('FEEDBACK', { message: '⚠️ Turn sideways to track dumbbell rows!' });
                        window.hadOrientationWarning = true;
                        return;
                    } else if (window.hadOrientationWarning) {
                        postMessageToRN('FEEDBACK', { message: '✅ Good side profile.' });
                        window.hadOrientationWarning = false;
                    }

                    // Angle of elbow relative to torso
                    const angle = calculateAngle(hip, shoulder, elbow);
                    
                    if (!window.maxAngleReached) window.maxAngleReached = 0;
                    
                    if (window.currentPhase === 'up') {
                        if (angle > window.maxAngleReached) window.maxAngleReached = angle;
                    }

                    // Arm hanging down -> Down Phase (Stretch)
                    if (angle < 30) {
                        if (window.currentPhase === 'up' && !window.repCooldown) {
                            window.repCooldown = true;
                            // Did they row the dumbbell high enough? (past the torso line)
                            if (window.maxAngleReached > 80) {
                                postMessageToRN('REP_COMPLETED', { repQuality: 'perfect', feedback: 'Perfect row! Great height.' });
                            } else {
                                postMessageToRN('REP_COMPLETED', { repQuality: 'flawed', feedback: 'Row the dumbbell higher!' });
                            }
                            setTimeout(() => { window.repCooldown = false; }, 1000);
                        }
                        window.currentPhase = 'down'; 
                        window.maxAngleReached = 0; // Reset
                        postMessageToRN('FEEDBACK', { message: 'Arm extended...' });
                    } 
                    // Pulling dumbbell up -> Up Phase (Contraction)
                    else if (angle > 45 && window.currentPhase === 'down') {
                        window.currentPhase = 'up'; 
                        postMessageToRN('FEEDBACK', { message: 'Pulling up...' });
                    }
                    else if (angle >= 30 && angle <= 80) {
                         postMessageToRN('FEEDBACK', { message: window.currentPhase === 'up' ? 'Rowing higher...' : 'Lowering dumbbell...' });
                    }
                } else {
                    if (!window.hadOrientationWarning) postMessageToRN('FEEDBACK', { message: 'Ensure your side profile is fully visible' });
                }
            }

            // --- HINGE LOGIC (Deadlifts, RDLs) ---
            // Tracks Hip extension (Shoulder, Hip, Knee)
            function processHinge(poses) {
                const side = getBestSide(poses, ['shoulder', 'hip', 'knee']);

                if (side) {
                    const [shoulder, hip, knee] = side;
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
                    postMessageToRN('FEEDBACK', { message: 'Ensure your full side profile is visible' });
                }
            }

            // --- PLANK LOGIC (Shoulder, Hip, Ankle) ---
            function processPlank(poses) {
                const side = getBestSide(poses, ['shoulder', 'hip', 'ankle']);
                if (side) {
                    const [shoulder, hip, ankle] = side;
                    const angle = calculateAngle(shoulder, hip, ankle);
                    
                    // A perfect plank is a straight line (180 degrees)
                    // We allow some margin (165-195)
                    if (angle >= 165 && angle <= 195) {
                        if (!window.holdFrames) window.holdFrames = 0;
                        window.holdFrames++;
                        
                        if (window.holdFrames > 30) { // ~1 second of perfect form
                             postMessageToRN('REP_COMPLETED', { repQuality: 'perfect', feedback: 'Perfect form! Keep holding.' });
                             window.holdFrames = 0;
                        }
                        postMessageToRN('FEEDBACK', { message: 'Great Plank! Hold steady.' });
                    } else if (angle < 165) {
                        window.holdFrames = 0;
                        postMessageToRN('FEEDBACK', { message: "Don't pike your hips! Lower them." });
                    } else if (angle > 195) {
                        window.holdFrames = 0;
                        postMessageToRN('FEEDBACK', { message: "Don't let your hips sag! Lift them up." });
                    }
                } else {
                    postMessageToRN('FEEDBACK', { message: 'Ensure full side profile is visible for Plank' });
                }
            }

            // --- HIGH KNEES LOGIC (Hip, Knee, Ankle) ---
            function processHighKnees(poses) {
                const side = getBestSide(poses, ['hip', 'knee', 'ankle']);
                if (side) {
                    const [hip, knee, ankle] = side;
                    
                    // VALIDATION: Ensure vertical separation (Ankle must be lower than Hip)
                    const verticalSpan = Math.abs(ankle.y - hip.y);
                    if (verticalSpan < 100) { // On face, this span would be tiny
                        postMessageToRN('FEEDBACK', { message: 'Step back to show your full legs' });
                        return;
                    }

                    const angle = calculateAngle(hip, knee, ankle);
                    
                    // Knee high trigger (angle < 100)
                    if (angle < 100 && window.currentPhase === 'down') {
                        window.currentPhase = 'up';
                        postMessageToRN('FEEDBACK', { message: 'Knee Up!' });
                    } 
                    // Foot back down trigger (angle > 160)
                    else if (angle > 160 && window.currentPhase === 'up') {
                        if (!window.repCooldown) {
                            window.repCooldown = true;
                            postMessageToRN('REP_COMPLETED', { repQuality: 'perfect', feedback: 'Great height!' });
                            setTimeout(() => { window.repCooldown = false; }, 500);
                        }
                        window.currentPhase = 'down';
                        postMessageToRN('FEEDBACK', { message: 'Keep running!' });
                    }
                } else {
                    postMessageToRN('FEEDBACK', { message: 'Ensure your legs are visible for High Knees' });
                }
            }

            // --- JUMPING JACKS LOGIC (Shoulder, Hip, Ankle) ---
            function processJumpingJacks(poses) {
                const lShoulder = poses[0].keypoints.find(k => k.name === 'left_shoulder');
                const rShoulder = poses[0].keypoints.find(k => k.name === 'right_shoulder');
                const lHip = poses[0].keypoints.find(k => k.name === 'left_hip');
                const rHip = poses[0].keypoints.find(k => k.name === 'right_hip');
                const lAnkle = poses[0].keypoints.find(k => k.name === 'left_ankle');
                const rAnkle = poses[0].keypoints.find(k => k.name === 'right_ankle');

                if (lShoulder?.score > 0.1 && rShoulder?.score > 0.1 && lAnkle?.score > 0.1 && rAnkle?.score > 0.1) {
                    // Track leg spread: distance between ankles vs distance between hips
                    const hipWidth = Math.abs(rHip.x - lHip.x);
                    const ankleWidth = Math.abs(rAnkle.x - lAnkle.x);
                    
                    // Trigger "UP" when legs are spread significantly wider than hips
                    if (ankleWidth > hipWidth * 2.5 && window.currentPhase === 'down') {
                        window.currentPhase = 'up';
                        postMessageToRN('FEEDBACK', { message: 'Jumping out!' });
                    }
                    // Trigger "DOWN" when legs come back together
                    else if (ankleWidth < hipWidth * 1.5 && window.currentPhase === 'up') {
                        if (!window.repCooldown) {
                            window.repCooldown = true;
                            postMessageToRN('REP_COMPLETED', { repQuality: 'perfect', feedback: 'Great Jack!' });
                            setTimeout(() => { window.repCooldown = false; }, 500);
                        }
                        window.currentPhase = 'down';
                        postMessageToRN('FEEDBACK', { message: 'Ready for next...' });
                    }
                } else {
                    postMessageToRN('FEEDBACK', { message: 'Ensure full body is visible for Jumping Jacks' });
                }
            }

            // --- HOLD LOGIC (Legacy / Fallback) ---
            function processHold(poses) {
                const lShoulder = poses[0].keypoints.find(k => k.name === 'left_shoulder');
                const rShoulder = poses[0].keypoints.find(k => k.name === 'right_shoulder');
                const nose = poses[0].keypoints.find(k => k.name === 'nose');

                if ((nose?.score > 0.1) || (lShoulder?.score > 0.2 && rShoulder?.score > 0.2)) {
                    if (!window.holdFrames) window.holdFrames = 0;
                    window.holdFrames++;
                    
                    if (window.holdFrames > 45) {
                         postMessageToRN('REP_COMPLETED', { repQuality: 'perfect', feedback: 'Hold it! Time added.' });
                         window.holdFrames = 0;
                    }
                    postMessageToRN('FEEDBACK', { message: 'Hold the position!' });
                } else {
                    window.holdFrames = 0;
                    postMessageToRN('FEEDBACK', { message: 'Hold your form in camera view' });
                }
            }

            // --- TRICEPS PUSHDOWN LOGIC (Shoulder, Elbow, Wrist) ---
            function processTriceps(poses) {
                const side = getBestSide(poses, ['shoulder', 'elbow', 'wrist']);

                if (side) {
                    const [shoulder, elbow, wrist] = side;

                    // --- ORIENTATION GUARD ---
                    const isValidOrientation = checkOrientation(poses);
                    if (!isValidOrientation) {
                        postMessageToRN('FEEDBACK', { message: '⚠️ Turn sideways to track triceps!' });
                        window.hadOrientationWarning = true;
                        return;
                    } else if (window.hadOrientationWarning) {
                        postMessageToRN('FEEDBACK', { message: 'Ready. Begin pushdowns!' });
                        window.hadOrientationWarning = false;
                    }

                    const angle = calculateAngle(shoulder, elbow, wrist);
                    
                    // Track the widest angle (max extension)
                    if (angle > window.maxAngleReached) {
                         window.maxAngleReached = angle;
                    }

                    // Arm returning up (bending) -> Down Phase (Eccentric)
                    if (angle < 100) {
                        if (window.currentPhase === 'up' && !window.repCooldown) {
                            window.repCooldown = true;

                            // Did they extend fully down?
                            if (window.maxAngleReached > 165) {
                                postMessageToRN('REP_COMPLETED', { repQuality: 'perfect', feedback: 'Perfect rep! Full extension.' });
                            } else {
                                postMessageToRN('REP_COMPLETED', { repQuality: 'flawed', feedback: 'Push all the way down!' });
                            }

                            setTimeout(() => { window.repCooldown = false; }, 1000);
                        }
                        window.currentPhase = 'down';
                        window.maxAngleReached = 0; // Reset for next rep
                        postMessageToRN('FEEDBACK', { message: 'Pushing down...' });
                    }
                    // Arm extending down -> Up Phase (Concentric)
                    else if (angle > 130 && window.currentPhase === 'down') {
                        window.currentPhase = 'up'; // 'Up' here means activating the muscle (pushing down)
                        postMessageToRN('FEEDBACK', { message: 'Extending...' });
                    }
                    else if (angle >= 100 && angle <= 130) {
                        postMessageToRN('FEEDBACK', { message: window.currentPhase === 'up' ? 'Returning weight...' : 'Keep pushing...' });
                    }
                } else {
                    if (!window.hadOrientationWarning) {
                        postMessageToRN('FEEDBACK', { message: 'Ensure your arm is fully visible' });
                    }
                }
            }

            // --- LATERAL RAISES LOGIC (Hip, Shoulder, Elbow) ---
            function processLateralRaises(poses) {
                // For lateral raises, front-facing is actually better to see the abduction angle.
                const lShoulder = poses[0].keypoints.find(k => k.name === 'left_shoulder');
                const lHip = poses[0].keypoints.find(k => k.name === 'left_hip');
                const lElbow = poses[0].keypoints.find(k => k.name === 'left_elbow');
                const rShoulder = poses[0].keypoints.find(k => k.name === 'right_shoulder');
                const rHip = poses[0].keypoints.find(k => k.name === 'right_hip');
                const rElbow = poses[0].keypoints.find(k => k.name === 'right_elbow');

                // --- ORIENTATION GUARD ---
                // We need to see them from the front/diagonal, not pure side profile.
                // Pure side profile hides one shoulder/hip entirely.
                if (lShoulder?.score < 0.3 || rShoulder?.score < 0.3 || lHip?.score < 0.3 || rHip?.score < 0.3) {
                    postMessageToRN('FEEDBACK', { message: '⚠️ Face the camera to track lateral raises!' });
                    window.hadOrientationWarning = true;
                    return; // Halt rep processing until turned
                } else if (window.hadOrientationWarning) {
                    postMessageToRN('FEEDBACK', { message: '✅ Perfect angle. Start raising.' });
                    window.hadOrientationWarning = false;
                }

                // Determine which arm to track based on better elbow visibility
                let activeSide = null;
                if (rElbow?.score >= lElbow?.score && rElbow?.score > 0.4) {
                     activeSide = [rHip, rShoulder, rElbow]; // Angle at shoulder joint
                } else if (lElbow?.score > 0.4) {
                     activeSide = [lHip, lShoulder, lElbow];
                }

                if (activeSide) {
                    const [hip, shoulder, elbow] = activeSide;
                    const angle = calculateAngle(hip, shoulder, elbow); // 0 = arm by side, 90 = arm parallel to floor

                    if (!window.maxAngleReached) window.maxAngleReached = 0;

                    // Track maximum height (widest angle)
                    if (angle > window.maxAngleReached) {
                        window.maxAngleReached = angle;
                    }

                    // Arm by side -> Down Phase
                    if (angle < 30) {
                        if (window.currentPhase === 'up' && !window.repCooldown) {
                            window.repCooldown = true;

                            // Did they raise it enough?
                            if (window.maxAngleReached > 80) {
                                postMessageToRN('REP_COMPLETED', { repQuality: 'perfect', feedback: 'Perfect rep! Arms parallel to the floor.' });
                            } else {
                                postMessageToRN('REP_COMPLETED', { repQuality: 'flawed', feedback: 'Raise arms higher (parallel to floor).' });
                            }

                            setTimeout(() => { window.repCooldown = false; }, 1000);
                        }
                        window.currentPhase = 'down';
                        window.maxAngleReached = 0; // Reset
                        postMessageToRN('FEEDBACK', { message: 'Ready for next raise...' });
                    }
                    // Arm raising up -> Up Phase
                    else if (angle > 40 && window.currentPhase === 'down') {
                        window.currentPhase = 'up';
                        postMessageToRN('FEEDBACK', { message: 'Raising...' });
                    }
                    else if (angle >= 30 && angle <= 40) {
                        postMessageToRN('FEEDBACK', { message: window.currentPhase === 'up' ? 'Lowering...' : 'Keep raising...' });
                    }

                } else {
                    postMessageToRN('FEEDBACK', { message: 'Ensure your upper body is visible for raises' });
                }
            }

            // --- ACCESSORY LOGIC (Generic) ---
            function processAccessory(poses, type) {
                if (type === 'accessory_arm') {
                    processBicepCurls(poses); 
                } else if (type === 'accessory_tricep') {
                    if (typeof window.maxAngleReached === 'undefined') window.maxAngleReached = 0;
                    processTriceps(poses);
                } else if (type === 'accessory_shoulder') {
                    if (typeof window.maxAngleReached === 'undefined') window.maxAngleReached = 0;
                    processLateralRaises(poses);
                } else if (type === 'accessory_leg') {
                    processSquats(poses); 
                } else if (type === 'accessory_core') {
                    processHold(poses); 
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
                                keypoints: p.keypoints.filter(k => k.score > 0.2).map(k => ({
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
                            } else if (window.activeExercise === 'press_pushup' || window.activeExercise === 'Push-ups') {
                                processPushups(poses);
                            } else if (window.activeExercise === 'press_knee_pushup' || window.activeExercise === 'Knee Push-ups') {
                                processKneePushups(poses);
                            } else if (window.activeExercise === 'press_barbell_bench' || window.activeExercise === 'Barbell Bench Press') {
                                processBarbellBench(poses);
                            } else if (window.activeExercise === 'press_dumbbell_bench' || window.activeExercise === 'Dumbbell Bench Press') {
                                processDumbbellBench(poses);
                            } else if (window.activeExercise === 'press_incline_bench' || window.activeExercise === 'Incline Dumbbell Press') {
                                processInclineBench(poses);
                            } else if (window.activeExercise === 'press_shoulder' || window.activeExercise === 'Dumbbell Shoulder Press') {
                                processShoulderPress(poses);
                            } else if (window.activeExercise === 'pull_lat' || window.activeExercise === 'Lat Pulldowns') {
                                processLatPulldown(poses);
                            } else if (window.activeExercise === 'pull_cable' || window.activeExercise === 'Seated Cable Rows') {
                                processCableRows(poses);
                            } else if (window.activeExercise === 'pull_dumbbell' || window.activeExercise === 'Dumbbell Rows') {
                                processDumbbellRow(poses);
                            } else if (window.activeExercise === 'hinge') {
                                processHinge(poses);
                            } else if (window.activeExercise === 'plank') {
                                processPlank(poses);
                            } else if (window.activeExercise === 'high_knees') {
                                processHighKnees(poses);
                            } else if (window.activeExercise === 'jumping_jacks') {
                                processJumpingJacks(poses);
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
            
            // Define the connections between the 17 MoveNet keypoints
            const SKELETON_CONNECTIONS = [
                ['left_ear', 'left_eye'], ['left_eye', 'nose'], ['right_eye', 'nose'], ['right_ear', 'right_eye'],
                ['left_shoulder', 'right_shoulder'], ['left_shoulder', 'left_elbow'], ['left_elbow', 'left_wrist'],
                ['right_shoulder', 'right_elbow'], ['right_elbow', 'right_wrist'],
                ['left_shoulder', 'left_hip'], ['right_shoulder', 'right_hip'], ['left_hip', 'right_hip'],
                ['left_hip', 'left_knee'], ['left_knee', 'left_ankle'],
                ['right_hip', 'right_knee'], ['right_knee', 'right_ankle']
            ];

            // Draw lines inside the webview (faster than React Native drawing)
            function drawSkeleton(pose) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                const kps = pose.keypoints;

                // 1. Draw glowing lines connecting the joints
                ctx.strokeStyle = 'rgba(19, 236, 91, 0.7)'; // Match the primary neon green, slightly transparent
                ctx.lineWidth = 4;
                
                SKELETON_CONNECTIONS.forEach(connection => {
                    const partA = connection[0];
                    const partB = connection[1];
                    const kpA = kps.find(k => k.name === partA);
                    const kpB = kps.find(k => k.name === partB);
                    
                    // Only draw the line if both connected joints are visible (very lenient threshold)
                    if (kpA && kpB && kpA.score > 0.1 && kpB.score > 0.1) {
                        ctx.beginPath();
                        ctx.moveTo(kpA.x, kpA.y);
                        ctx.lineTo(kpB.x, kpB.y);
                        ctx.stroke();
                    }
                });
                
                // 2. Draw dots for high confidence points ON TOP of the lines
                kps.forEach(kp => {
                    if (kp.score > 0.1) {
                        ctx.fillStyle = '#13EC5B'; // Solid primary green
                        ctx.beginPath();
                        ctx.arc(kp.x, kp.y, 6, 0, 2 * Math.PI);
                        ctx.fill();
                        
                        // Add a white center to make the joints pop like a professional UI
                        ctx.fillStyle = '#FFFFFF';
                        ctx.beginPath();
                        ctx.arc(kp.x, kp.y, 2, 0, 2 * Math.PI);
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

                // Trigger large overlay for significant warnings
                if (data.message.includes('⚠️')) {
                    setShowLargeWarning(true);
                } else {
                    setShowLargeWarning(false);
                }
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
                        onPress={async () => {
                            const { status } = await ExpoCamera.requestCameraPermissionsAsync();
                            if (status === 'granted') {
                                setHasPermission(true);
                                setIsCameraActive(true);
                            } else {
                                alert("Camera access is needed for AI form tracking.");
                            }
                        }}
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
                    allowFileAccess={true}
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
                    onError={(syntheticEvent) => {
                        const { nativeEvent } = syntheticEvent;
                        console.warn('WebView error:', nativeEvent);
                    }}
                />

                {/* Large Visibility Overlay for Orientation/Form Warnings */}
                {showLargeWarning && isTrackerReady && (
                    <View style={styles.largeWarningOverlay}>
                        <View style={styles.largeWarningBox}>
                            <AlertCircle size={48} color={theme.colors.primary} style={{ marginBottom: 15 }} />
                            <Text style={styles.largeWarningText}>{feedback}</Text>
                        </View>
                    </View>
                )}

                {/* AI Initialization Loading Overlay */}
                {!isTrackerReady && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginBottom: 20, transform: [{ scale: 1.5 }] }} />
                        <Text style={styles.loadingTitle}>Waking up AI Engine...</Text>
                        <Text style={styles.loadingSubtitle}>Loading neural networks and connecting your skeletal tracker.</Text>
                    </View>
                )}

                {/* Workout HUD Overlay */}
                <View style={[styles.workoutHud, !isTrackerReady && { opacity: 0 }]}>
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
    },
    largeWarningOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
        backgroundColor: 'rgba(0,0,0,0.1)', // Subtle tint for the whole screen
    },
    largeWarningBox: {
        width: width * 0.85,
        backgroundColor: 'rgba(0,0,0,0.75)', // High contrast 75% dark
        padding: 30,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(19, 236, 91, 0.5)', // Neon border for attention
    },
    largeWarningText: {
        color: '#FFF',
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 30,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 50,
        paddingHorizontal: 40,
    },
    loadingTitle: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    loadingSubtitle: {
        color: theme.colors.primary,
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '600',
        lineHeight: 20,
    }
});

export default WorkoutTrackingScreen;
