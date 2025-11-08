export class HUD {
    private healthFill: HTMLElement;
    private healthText: HTMLElement;
    private weaponName: HTMLElement;
    private ammoCurrent: HTMLElement;
    private ammoReserve: HTMLElement;
    private killFeed: HTMLElement;
    private freeCamIndicator: HTMLElement;
    private xpContainer: HTMLElement;

    constructor() {
        this.healthFill = document.getElementById('health-fill')!;
        this.healthText = document.getElementById('health-text')!;
        this.weaponName = document.getElementById('weapon-name')!;
        this.ammoCurrent = document.getElementById('ammo-current')!;
        this.ammoReserve = document.getElementById('ammo-reserve')!;
        this.killFeed = document.getElementById('kill-feed')!;

        // Create free cam indicator if it doesn't exist
        this.freeCamIndicator = document.getElementById('freecam-indicator') || this.createFreeCamIndicator();

        // Create XP display
        this.xpContainer = this.createXPDisplay();
    }

    private createFreeCamIndicator(): HTMLElement {
        const indicator = document.createElement('div');
        indicator.id = 'freecam-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 100, 0, 0.9);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 16px;
            font-weight: bold;
            display: none;
            z-index: 1000;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
            border: 2px solid rgba(255, 150, 0, 1);
        `;
        indicator.textContent = '🎥 FREE CAM MODE - Press TAB to exit | WASD to move';
        document.body.appendChild(indicator);
        return indicator;
    }

    private createXPDisplay(): HTMLElement {
        const container = document.createElement('div');
        container.id = 'xp-display';
        container.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 20px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 8px 12px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 14px;
            z-index: 100;
            border: 2px solid rgba(255, 215, 0, 0.6);
            min-width: 200px;
        `;

        // Level display
        const levelText = document.createElement('div');
        levelText.id = 'xp-level';
        levelText.style.cssText = `
            font-weight: bold;
            margin-bottom: 4px;
            color: #FFD700;
            font-size: 15px;
        `;
        levelText.textContent = 'Level 0';

        // XP bar container
        const xpBarBg = document.createElement('div');
        xpBarBg.style.cssText = `
            width: 100%;
            height: 16px;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid rgba(255, 215, 0, 0.3);
            position: relative;
        `;

        // XP bar fill
        const xpBarFill = document.createElement('div');
        xpBarFill.id = 'xp-fill';
        xpBarFill.style.cssText = `
            height: 100%;
            width: 0%;
            background: linear-gradient(90deg, #FFD700 0%, #FFA500 100%);
            transition: width 0.3s ease;
            border-radius: 8px;
        `;

        // XP text overlay
        const xpText = document.createElement('div');
        xpText.id = 'xp-text';
        xpText.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: bold;
            color: white;
            text-shadow: 1px 1px 2px black;
        `;
        xpText.textContent = '0 / 100';

        xpBarBg.appendChild(xpBarFill);
        xpBarBg.appendChild(xpText);
        container.appendChild(levelText);
        container.appendChild(xpBarBg);

        document.body.appendChild(container);
        return container;
    }

    showSpectatorMode(): void {
        this.freeCamIndicator.textContent = '👁️ SPECTATOR MODE - TAB: Free Cam | SCROLL: Zoom';
        this.freeCamIndicator.style.background = 'rgba(100, 100, 255, 0.9)';
        this.freeCamIndicator.style.border = '2px solid rgba(150, 150, 255, 1)';
        this.freeCamIndicator.style.display = 'block';
    }

    updateHealth(health: number): void {
        const healthPercent = Math.max(0, Math.min(100, health));
        this.healthFill.style.width = `${healthPercent}%`;
        this.healthText.textContent = Math.ceil(health).toString();
    }

    updateWeapon(weaponName: string | null): void {
        this.weaponName.textContent = weaponName ?? 'Fists';
    }

    updateAmmo(current: number, reserve: number): void {
        this.ammoCurrent.textContent = current.toString();
        this.ammoReserve.textContent = reserve.toString();
    }

    addKillMessage(message: string): void {
        const element = document.createElement('div');
        element.className = 'kill-message';
        element.textContent = message;
        this.killFeed.prepend(element);

        setTimeout(() => {
            element.remove();
        }, 5000);
    }

    showDeathScreen(): void {
        document.getElementById('death-screen')!.classList.add('visible');
    }

    hideDeathScreen(): void {
        document.getElementById('death-screen')!.classList.remove('visible');
    }

    showFreeCamIndicator(): void {
        this.freeCamIndicator.style.display = 'block';
    }

    hideFreeCamIndicator(): void {
        this.freeCamIndicator.style.display = 'none';
    }

    updateXP(xp: number, level: number): void {
        const levelText = document.getElementById('xp-level')!;
        const xpFill = document.getElementById('xp-fill')!;
        const xpText = document.getElementById('xp-text')!;

        // Update level display
        levelText.textContent = `Level ${level}`;

        // Calculate XP progress within current level
        const xpInCurrentLevel = xp % 100;
        const xpNeededForNextLevel = 100;
        const progressPercent = (xpInCurrentLevel / xpNeededForNextLevel) * 100;

        // Update progress bar
        xpFill.style.width = `${progressPercent}%`;
        xpText.textContent = `${xpInCurrentLevel} / ${xpNeededForNextLevel}`;
    }
}
