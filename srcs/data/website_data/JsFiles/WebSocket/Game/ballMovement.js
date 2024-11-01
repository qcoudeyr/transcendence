import { getBall, getPad0 } from "../../3d/3d.js";

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
        console.error("No BALL data found.");
    }
}