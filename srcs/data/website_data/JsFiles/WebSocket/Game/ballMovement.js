import { getBall, getScene } from "../../3d/3d.js";
import * as THREE from 'three';

export function mooveBall(object, x, y, z)
{
	let scene = getScene();
	const ball = getBall();
// Create the ball mesh
if	(object === ball)
{
	
	ball.position.x = x;
	ball.position.y = y;
	ball.position.z = z;
}
	

}
