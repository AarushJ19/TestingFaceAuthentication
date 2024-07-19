$(document).ready(function() {
    const video = document.getElementById('videoElement');
    const startButton = $('#start-button');
    const captureButton = $('#capture-button');
    const usernameInput = $('#username');

    const startLoginButton = $('#start-login-button');
    const loginButton = $('#login-button');

    async function loadModels() {
        try {
            await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
            await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
            await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
            console.log("Models loaded successfully");
        } catch (err) {
            console.error("Error loading models: ", err);
        }
    }

    async function startVideo() {
        navigator.mediaDevices.getUserMedia({ video: {} })
            .then(stream => {
                video.srcObject = stream;
                video.style.display = 'block';
                captureButton.show();
                loginButton.show();
            })
            .catch(err => console.error("Error starting video: ", err));
    }

    async function getFaceDescriptor(videoElement) {
        const detection = await faceapi.detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
        if (!detection) {
            console.warn("No face detected");
            return null;
        }
        return detection.descriptor;
    }

    startButton.click(async function() {
        if (usernameInput.val().trim() === '') {
            alert('Please enter a username.');
        } else {
            await loadModels();
            startVideo();
        }
    });

    captureButton.click(async function() {
        const faceData = await getFaceDescriptor(video);
        if (faceData) {
            const username = usernameInput.val();
            localStorage.setItem(username, JSON.stringify(faceData));
            console.log(`User ${username} registered. Face data:`, faceData);
            alert('Registration successful');
        } else {
            alert('No face detected. Please try again.');
        }
    });

    startLoginButton.click(async function() {
        await loadModels();
        startVideo();
    });

    loginButton.click(async function() {
        const faceData = await getFaceDescriptor(video);
        if (faceData) {
            const labeledDescriptors = [];
            const storedUsers = Object.keys(localStorage);
            for (let user of storedUsers) {
                try {
                    const storedFaceData = JSON.parse(localStorage.getItem(user));
                    const labeledDescriptor = new faceapi.LabeledFaceDescriptors(user, [new Float32Array(storedFaceData)]);
                    labeledDescriptors.push(labeledDescriptor);
                } catch (e) {
                    console.error(`Error parsing data for user ${user}:`, e);
                    localStorage.removeItem(user); // Optionally remove invalid data
                }
            }
            if (labeledDescriptors.length === 0) {
                alert('No registered users found.');
                return;
            }

            const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6); // Adjust the threshold as needed
            const bestMatch = faceMatcher.findBestMatch(faceData);
            if (bestMatch.label !== 'unknown') {
                console.log(`User ${bestMatch.label} logged in. Face data:`, faceData);
                alert(`Welcome back, ${bestMatch.label}`);
            } else {
                alert('Face not recognized. Please try again.');
            }
        } else {
            alert('No face detected. Please try again.');
        }
    });
});
