import { getBall } from "../../3d/3d.js";

export function mooveBall(object, x, y, z)
{
	const ball = getBall();
// Create the ball mesh
if	(object === "BALL")
{	
	ball.position.x = x;
	ball.position.y = y;
	ball.position.z = z;
}
}
