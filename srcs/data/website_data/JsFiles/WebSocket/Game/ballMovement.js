import { getBall, getPad0, getPad1, getCameraPad0 } from "../../3d/3d.js";

export function mooveBall(data) {
    // Ensure the data contains "BALL" information
    if (data && data.BALL) {
        // Get the ball mesh from your existing function
        const ball = getBall();
        ball.position.x = data.BALL.x;
        ball.position.y = data.BALL.y;
        ball.position.z = data.BALL.z;
    } else {
        console.error("No BALL data found.");
    }
}

export function moovePad(data) {
	if (data && data.PAD_0) {
        // Get the ball mesh from your existing function
        const pad0 = getPad0();
        pad0.position.x = data.PAD_0.x;
        pad0.position.y = data.PAD_0.y;
        pad0.position.z = data.PAD_0.z;
    } else {
        console.error("No pad data found.");
    }
}

export function moovePad2(data) {
	if (data && data.PAD_1) {
        // Get the ball mesh from your existing function
        const pad1 = getPad1();
        pad1.position.x = data.PAD_1.x;
        pad1.position.y = data.PAD_1.y;
        pad1.position.z = data.PAD_1.z;
    } else {
        console.error("No pad data found.");
    }
}

export function mooveCamera1(data)
{
	if (data && data.CAMERA) {
        // Get the ball mesh from your existing function
        const cam = getCameraPad0();
        cam.position.x = data.CAMERA.x;
        cam.position.y = data.CAMERA.y;
        cam.position.z = data.CAMERA.z;
    } else {
        console.error("No camera data found.");
    }
}