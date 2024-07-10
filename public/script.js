$(document).ready(function() {
    const video = document.getElementById('videoElement');
    const startButton = $('#start-button');
    const captureButton = $('#capture-button');
    const usernameInput = $('#username');

    const startLoginButton = $('#start-login-button');
    const loginButton = $('#login-button');

    async function loadModels() {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
    }

    async function startVideo() {
        navigator.mediaDevices.getUserMedia({ video: {} })
            .then(stream => {
                video.srcObject = stream;
                video.style.display = 'block';
                captureButton.show();
                loginButton.show();
            })
            .catch(err => console.error(err));
    }

    async function getFaceDescriptor(videoElement) {
        const detection = await faceapi.detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
        return detection ? detection.descriptor : null;
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
            const storedUsers = Object.keys(localStorage);
            let matchFound = false;
            for (let user of storedUsers) {
                try {
                    const storedFaceData = JSON.parse(localStorage.getItem(user));
                    if (storedFaceData.length === faceData.length) {
                        const distance = faceapi.euclideanDistance(storedFaceData, faceData);
                        if (distance < 0.6) { // Adjust the threshold as needed
                            console.log(`User ${user} logged in. Face data:`, faceData);
                            alert(`Welcome back, ${user}`);
                            matchFound = true;
                            break;
                        }
                    }
                } catch (e) {
                    console.error(`Error parsing data for user ${user}:`, e);
                    localStorage.removeItem(user); // Optionally remove invalid data
                }
            }
            if (!matchFound) {
                alert('Face not recognized. Please try again.');
            }
        } else {
            alert('No face detected. Please try again.');
        }
    });
});
