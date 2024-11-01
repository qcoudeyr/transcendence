import { getBall } from "../../3d/3d.js";

export function mooveBall(data) {
    // Ensure the data contains "BALL" information
    if (data && data.BALL) {
        // Get the ball mesh from your existing function
        const ball = getBall();

        // Log the incoming position data
        console.log("Received BALL data:");
        console.log("x:", data.BALL.x);
        console.log("y:", data.BALL.y);
        console.log("z:", data.BALL.z);

        // Update the ball's position
        ball.position.x = data.BALL.x;
        ball.position.y = data.BALL.y;
        ball.position.z = data.BALL.z;

        // Log the updated ball position to verify
        console.log("Updated ball position:");
        console.log("x:", ball.position.x);
        console.log("y:", ball.position.y);
        console.log("z:", ball.position.z);
    } else {
        console.error("No BALL data found.");
    }
}
