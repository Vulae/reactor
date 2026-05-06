export class Stats {
    public totalHeatDissipatedThisReset: number = 0;
    public totalPowerGeneratedThisReset: number = 0;
    public totalMoneyGainedThisReset: number = 0;

    public reset(): void {
        this.totalHeatDissipated += this.totalHeatDissipatedThisReset;
        this.totalPowerGenerated += this.totalPowerGeneratedThisReset;
        this.totalMoneyGained += this.totalMoneyGainedThisReset;
        this.totalHeatDissipatedThisReset = 0;
        this.totalPowerGeneratedThisReset = 0;
        this.totalMoneyGainedThisReset = 0;
    }

    public totalHeatDissipated: number = 0;
    public totalPowerGenerated: number = 0;
    public totalMoneyGained: number = 0;
}
