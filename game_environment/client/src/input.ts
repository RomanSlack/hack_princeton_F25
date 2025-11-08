import { Vec, type Vector } from "../../common/src/utils/vector";
import type { Camera } from "./camera";
import { PacketType, type InputPacket } from "../../common/src/packets";

export class InputManager {
    keys = {
        up: false,
        down: false,
        left: false,
        right: false
    };

    mouse = {
        x: 0,
        y: 0,
        down: false
    };

    actions = {
        switchWeapon: false,
        pickup: false,
        reload: false,
        interact: false,
        shoot: false  // One-time shoot action
    };

    private inputSequence = 0;
    private camera: Camera | null = null;

    // Callback for free cam toggle
    private onFreeCamToggle: (() => void) | null = null;

    constructor(private canvas: HTMLCanvasElement) {
        this.setupListeners();
    }

    setCamera(camera: Camera): void {
        this.camera = camera;
    }

    setFreeCamToggleCallback(callback: () => void): void {
        this.onFreeCamToggle = callback;
    }

    private setupListeners(): void {
        window.addEventListener('keydown', (e) => {
            switch (e.code) {
                case 'KeyW': this.keys.up = true; break;
                case 'KeyS': this.keys.down = true; break;
                case 'KeyA': this.keys.left = true; break;
                case 'KeyD': this.keys.right = true; break;
                case 'Digit1':
                case 'Digit2':
                    this.actions.switchWeapon = true;
                    break;
                case 'KeyF': this.actions.pickup = true; break;
                case 'KeyE': this.actions.interact = true; break;
                case 'KeyR': this.actions.reload = true; break;
                case 'Tab':
                    e.preventDefault(); // Prevent tab from changing focus
                    if (this.onFreeCamToggle) {
                        this.onFreeCamToggle();
                    }
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch (e.code) {
                case 'KeyW': this.keys.up = false; break;
                case 'KeyS': this.keys.down = false; break;
                case 'KeyA': this.keys.left = false; break;
                case 'KeyD': this.keys.right = false; break;
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.mouse.down = true;
                this.actions.shoot = true; // Trigger one-time shoot
            }
        });

        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.mouse.down = false;
        });

        // Prevent context menu
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // Mouse wheel for zoom (spectators only)
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault(); // Prevent page scroll

            if (this.camera) {
                // Normalize wheel delta (different browsers have different values)
                // Negative delta = scroll up = zoom in
                // Positive delta = scroll down = zoom out
                const delta = Math.sign(e.deltaY) * -0.3;
                this.camera.adjustZoom(delta);
            }
        }, { passive: false }); // passive: false allows preventDefault
    }

    getInputPacket(camera: Camera): InputPacket {
        const worldMouse = camera.screenToWorld(Vec(this.mouse.x, this.mouse.y));

        // If in free cam mode, send empty input (don't control player)
        if (camera.isFreeCamEnabled()) {
            const packet: InputPacket = {
                type: PacketType.Input,
                seq: this.inputSequence++,
                movement: { up: false, down: false, left: false, right: false },
                mouse: worldMouse,
                attacking: false,
                actions: {
                    switchWeapon: false,
                    pickup: false,
                    reload: false,
                    interact: false
                }
            };

            // Reset one-time actions
            this.actions.switchWeapon = false;
            this.actions.pickup = false;
            this.actions.reload = false;
            this.actions.interact = false;

            return packet;
        }

        // Normal mode - send actual player input
        const packet: InputPacket = {
            type: PacketType.Input,
            seq: this.inputSequence++,
            movement: { ...this.keys },
            mouse: worldMouse,
            attacking: this.actions.shoot, // Use one-time shoot action
            actions: {
                switchWeapon: this.actions.switchWeapon,
                pickup: this.actions.pickup,
                reload: this.actions.reload,
                interact: this.actions.interact
            }
        };

        // Reset one-time actions
        this.actions.switchWeapon = false;
        this.actions.pickup = false;
        this.actions.reload = false;
        this.actions.interact = false;
        this.actions.shoot = false; // Reset shoot action

        return packet;
    }

    // Get camera movement direction for free cam
    getFreeCamDirection(): Vector {
        let x = 0;
        let y = 0;

        if (this.keys.up) y -= 1;
        if (this.keys.down) y += 1;
        if (this.keys.left) x -= 1;
        if (this.keys.right) x += 1;

        // Normalize diagonal movement
        if (x !== 0 && y !== 0) {
            const length = Math.sqrt(x * x + y * y);
            x /= length;
            y /= length;
        }

        return Vec(x, y);
    }
}
