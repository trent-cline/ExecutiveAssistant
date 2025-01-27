<!-- src/routes/company/cloud-costs/+page.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import tippy from 'tippy.js';
    import 'tippy.js/dist/tippy.css';
    import 'tippy.js/animations/scale.css';

    // -----------------------
    // Default rate constants
    // Adjust these to reflect real AWS prices or your negotiated rates
    // -----------------------
    const DEFAULT_DAYS_PER_MONTH = 30;

    // Aurora
    const AURORA_INSTANCE_COST = 500;   // Monthly compute cost for a moderate Aurora instance
    const AURORA_INSTANCE_COST_HIGH = 2000; // For higher workloads
    const AURORA_STORAGE_COST_PER_GB = 0.10; // Example monthly storage cost per GB
    const AURORA_BACKUP_COST_PER_GB = 0.02;  // Cost per GB of backup

    // Kinesis
    const KINESIS_INGEST_COST_PER_GB = 0.035;

    // Lambda
    const LAMBDA_REQUEST_COST_PER_MILLION = 0.20;    // $ per 1M requests
    const LAMBDA_DURATION_COST_PER_GB_SECOND = 0.0000167;

    // Redshift
    const REDSHIFT_STORAGE_COST_PER_TB = 300;   // Example monthly cost per TB
    const REDSHIFT_SMALL_CLUSTER = 1000;        // Example small cluster monthly cost
    const REDSHIFT_MED_CLUSTER = 2000;
    const REDSHIFT_LARGE_CLUSTER = 4000;

    // Sigma (or any BI tool)
    const BI_LICENSE_COST_PER_USER = 30;

    // IoT Device Management (Particle)
    const DEVICE_MANAGEMENT_COST_PER_DEVICE = 2;

    // -----------------------
    // User Inputs (with some defaults)
    // -----------------------

    // Number of trucks
    let truckCount: number = 400;

    // Telemetry data per truck per day (in MB)
    let telemetryMBPerTruckPerDay: number = 144;

    // Data Ingestion (Kinesis) cost rate
    let kinesisIngestRate: number = KINESIS_INGEST_COST_PER_GB;

    // Aurora instance cost
    let auroraInstanceCost: number = AURORA_INSTANCE_COST; 

    // Aurora storage usage in GB per month
    let auroraStorageGB: number = ((telemetryMBPerTruckPerDay * truckCount) / 1024) * DEFAULT_DAYS_PER_MONTH;

    // Aurora backup in GB
    let auroraBackupGB: number = 1000; // Start with a default of 1000 GB

    // Lambda usage inputs
    let lambdaInvocationsPerTruckPerDay: number = 288; // e.g. one invocation every 5 minutes
    let lambdaMemoryMB: number = 128;
    let lambdaAvgDurationMs: number = 300;

    // Memory and duration calculations
    let memoryGB: number;
    let durationSeconds: number;
    let lambdaGBSeconds: number;

    $: memoryGB = lambdaMemoryMB / 1024;
    $: durationSeconds = lambdaAvgDurationMs / 1000;
    $: lambdaGBSeconds = totalLambdaInvocations * memoryGB * durationSeconds;

    // Redshift cluster cost
    let redshiftClusterCost: number = REDSHIFT_SMALL_CLUSTER;
    // Redshift storage (in TB)
    let redshiftStorageTB: number = 2;

    // BI tool
    let numberOfBIUsers: number = 10;

    // IoT device cost (e.g., Particle)
    let iotDeviceCostPerDevice: number = DEVICE_MANAGEMENT_COST_PER_DEVICE;

    // Margin
    let profitMarginPercent: number = 30;

    // Format currency with proper commas and decimals
    function formatCurrency(amount: number): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

    // Format percentage
    function formatPercent(value: number): string {
        return new Intl.NumberFormat('en-US', {
            style: 'percent',
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }).format(value / 100);
    }

    // Format large numbers with K/M/B suffixes
    function formatNumber(num: number): string {
        if (num >= 1000000000) {
            return (num / 1000000000).toFixed(1) + 'B';
        }
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toFixed(0);
    }

    // Tooltip content
    const tooltips = {
        aurora: "Aurora is a managed relational database service. The cost includes instance compute, storage, and backup costs.",
        kinesis: "Kinesis handles real-time data streaming from IoT devices. Cost is based on data ingestion volume.",
        lambda: "Lambda runs your serverless functions. Costs are based on number of invocations and execution time.",
        redshift: "Redshift is a data warehouse for analytics. Cost includes cluster compute and storage.",
        biTool: "Business Intelligence tool licenses for data analysis and visualization.",
        iotDevices: "IoT device management platform costs per connected truck.",
        truckCount: "Enter the total number of trucks in your fleet that will be connected to the platform.",
        telemetryData: "Amount of data each truck sends daily. Includes GPS, sensor data, and diagnostics.",
        margin: "Profit margin percentage to add to the base cost per truck."
    };

    // -----------------------
    // Calculation Helpers
    // -----------------------

    /**
     * Aurora cost calculation
     */
    $: auroraMonthlyCost = (
        auroraInstanceCost
        + (auroraStorageGB * AURORA_STORAGE_COST_PER_GB)
        + (auroraBackupGB * AURORA_BACKUP_COST_PER_GB)
    );

    /**
     * Kinesis cost calculation
     */
    $: totalTelemetryGBPerMonth = ((telemetryMBPerTruckPerDay * truckCount) / 1024) * DEFAULT_DAYS_PER_MONTH;
    $: kinesisMonthlyCost = totalTelemetryGBPerMonth * kinesisIngestRate;

    /**
     * Lambda cost calculation
     */
    $: totalLambdaInvocations = lambdaInvocationsPerTruckPerDay * truckCount * DEFAULT_DAYS_PER_MONTH;
    $: lambdaRequestCost = (totalLambdaInvocations / 1_000_000) * LAMBDA_REQUEST_COST_PER_MILLION;
    $: lambdaDurationCost = lambdaGBSeconds * LAMBDA_DURATION_COST_PER_GB_SECOND;
    $: lambdaMonthlyCost = lambdaRequestCost + lambdaDurationCost;

    /**
     * Redshift cost calculation
     */
    $: redshiftMonthlyCost = redshiftClusterCost + (redshiftStorageTB * REDSHIFT_STORAGE_COST_PER_TB);

    /**
     * BI tool cost calculation
     */
    $: biMonthlyCost = numberOfBIUsers * BI_LICENSE_COST_PER_USER;

    /**
     * IoT device cost calculation
     */
    $: iotMonthlyCost = truckCount * iotDeviceCostPerDevice;

    /**
     * Total cost calculations
     */
    $: totalMonthlyCost = auroraMonthlyCost + kinesisMonthlyCost + lambdaMonthlyCost + redshiftMonthlyCost + biMonthlyCost + iotMonthlyCost;
    $: costPerTruck = totalMonthlyCost / truckCount;
    $: costPerTruckWithMargin = costPerTruck * (1 + profitMarginPercent / 100);
    $: totalMonthlyPrice = costPerTruckWithMargin * truckCount;

    // Initialize tooltips on mount
    onMount(() => {
        tippy('[data-tippy-content]', {
            animation: 'scale',
            theme: 'custom',
            placement: 'top',
        });
    });
</script>

<svelte:head>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
        <div class="text-center mb-12">
            <h2 class="text-4xl font-bold text-gray-900 mb-2">AWS Cost Calculator</h2>
            <p class="text-lg text-gray-600">Calculate infrastructure costs with detailed breakdowns</p>
        </div>

        <div class="flex flex-col lg:flex-row gap-8">
            <!-- Main Calculator Section -->
            <div class="w-full lg:w-2/3">
                <div class="bg-white rounded-2xl shadow-xl p-6">
                    <form>
                        <!-- Input Section -->
                        <div class="bg-white rounded-2xl shadow-xl p-6">
                            <h2 class="text-xl font-semibold text-gray-900 mb-6">Infrastructure Configuration</h2>
                            
                            <!-- Fleet Size -->
                            <div class="mb-6">
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    Number of Trucks
                                    <i class="fas fa-info-circle text-gray-400 ml-1" data-tippy-content={tooltips.truckCount}></i>
                                </label>
                                <div class="relative">
                                    <input
                                        type="number"
                                        bind:value={truckCount}
                                        class="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        min="1"
                                        placeholder="Enter fleet size"
                                    />
                                    <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <span class="text-gray-500 sm:text-sm">trucks</span>
                                    </div>
                                </div>
                                <p class="mt-1 text-sm text-gray-500">Recommended: Start with actual fleet size</p>
                            </div>

                            <!-- Telemetry Data -->
                            <div class="mb-6">
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    Daily Telemetry Data per Truck
                                    <i class="fas fa-info-circle text-gray-400 ml-1" data-tippy-content={tooltips.telemetryData}></i>
                                </label>
                                <div class="relative">
                                    <input
                                        type="number"
                                        bind:value={telemetryMBPerTruckPerDay}
                                        class="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        min="1"
                                        placeholder="Enter MB per day"
                                    />
                                    <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <span class="text-gray-500 sm:text-sm">MB/day</span>
                                    </div>
                                </div>
                                <p class="mt-1 text-sm text-gray-500">Typical range: 100-200 MB per truck per day</p>
                            </div>

                            <!-- Profit Margin -->
                            <div class="mb-6">
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    Profit Margin
                                    <i class="fas fa-info-circle text-gray-400 ml-1" data-tippy-content={tooltips.margin}></i>
                                </label>
                                <div class="relative">
                                    <input
                                        type="number"
                                        bind:value={profitMarginPercent}
                                        class="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        min="0"
                                        max="100"
                                        placeholder="Enter margin percentage"
                                    />
                                    <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <span class="text-gray-500 sm:text-sm">%</span>
                                    </div>
                                </div>
                                <p class="mt-1 text-sm text-gray-500">Recommended: 20-40%</p>
                            </div>
                        </div>

                        <div class="calculations mt-6 pt-6 border-t border-gray-200">
                            <!-- Service Costs Container -->
                            <div class="bg-gray-50 rounded-xl border border-gray-200 p-6">
                                <div class="space-y-4">
                                    <!-- Individual Service Costs -->
                                    <div class="divide-y divide-gray-200">
                                        <div class="py-3 flex items-center justify-between group">
                                            <div class="flex items-center">
                                                <i class="fas fa-database text-indigo-500 mr-2"></i>
                                                <span class="text-gray-600">Aurora</span>
                                                <i class="fas fa-info-circle text-gray-400 ml-2" data-tippy-content={tooltips.aurora}></i>
                                            </div>
                                            <div class="flex items-center space-x-2">
                                                <span class="px-3 py-1 bg-white rounded-lg border border-gray-200 shadow-sm text-gray-900 font-medium group-hover:border-indigo-300 transition-colors">
                                                    {formatCurrency(auroraMonthlyCost)}
                                                </span>
                                                <span class="text-xs text-gray-500">/mo</span>
                                            </div>
                                        </div>
                                        
                                        <div class="py-3 flex items-center justify-between group">
                                            <div class="flex items-center">
                                                <i class="fas fa-stream text-indigo-500 mr-2"></i>
                                                <span class="text-gray-600">Kinesis</span>
                                                <i class="fas fa-info-circle text-gray-400 ml-2" data-tippy-content={tooltips.kinesis}></i>
                                            </div>
                                            <div class="flex items-center space-x-2">
                                                <span class="px-3 py-1 bg-white rounded-lg border border-gray-200 shadow-sm text-gray-900 font-medium group-hover:border-indigo-300 transition-colors">
                                                    {formatCurrency(kinesisMonthlyCost)}
                                                </span>
                                                <span class="text-xs text-gray-500">/mo</span>
                                            </div>
                                        </div>
                                        
                                        <!-- Repeat similar structure for other services -->
                                        <div class="py-3 flex items-center justify-between group">
                                            <div class="flex items-center">
                                                <i class="fas fa-bolt text-indigo-500 mr-2"></i>
                                                <span class="text-gray-600">Lambda</span>
                                                <i class="fas fa-info-circle text-gray-400 ml-2" data-tippy-content={tooltips.lambda}></i>
                                            </div>
                                            <div class="flex items-center space-x-2">
                                                <span class="px-3 py-1 bg-white rounded-lg border border-gray-200 shadow-sm text-gray-900 font-medium group-hover:border-indigo-300 transition-colors">
                                                    {formatCurrency(lambdaMonthlyCost)}
                                                </span>
                                                <span class="text-xs text-gray-500">/mo</span>
                                            </div>
                                        </div>
                                        
                                        <div class="py-3 flex items-center justify-between group">
                                            <div class="flex items-center">
                                                <i class="fas fa-warehouse text-indigo-500 mr-2"></i>
                                                <span class="text-gray-600">Redshift</span>
                                                <i class="fas fa-info-circle text-gray-400 ml-2" data-tippy-content={tooltips.redshift}></i>
                                            </div>
                                            <div class="flex items-center space-x-2">
                                                <span class="px-3 py-1 bg-white rounded-lg border border-gray-200 shadow-sm text-gray-900 font-medium group-hover:border-indigo-300 transition-colors">
                                                    {formatCurrency(redshiftMonthlyCost)}
                                                </span>
                                                <span class="text-xs text-gray-500">/mo</span>
                                            </div>
                                        </div>
                                        
                                        <div class="py-3 flex items-center justify-between group">
                                            <div class="flex items-center">
                                                <i class="fas fa-chart-bar text-indigo-500 mr-2"></i>
                                                <span class="text-gray-600">BI Tool</span>
                                                <i class="fas fa-info-circle text-gray-400 ml-2" data-tippy-content={tooltips.biTool}></i>
                                            </div>
                                            <div class="flex items-center space-x-2">
                                                <span class="px-3 py-1 bg-white rounded-lg border border-gray-200 shadow-sm text-gray-900 font-medium group-hover:border-indigo-300 transition-colors">
                                                    {formatCurrency(biMonthlyCost)}
                                                </span>
                                                <span class="text-xs text-gray-500">/mo</span>
                                            </div>
                                        </div>
                                        
                                        <div class="py-3 flex items-center justify-between group">
                                            <div class="flex items-center">
                                                <i class="fas fa-microchip text-indigo-500 mr-2"></i>
                                                <span class="text-gray-600">IoT Devices</span>
                                                <i class="fas fa-info-circle text-gray-400 ml-2" data-tippy-content={tooltips.iotDevices}></i>
                                            </div>
                                            <div class="flex items-center space-x-2">
                                                <span class="px-3 py-1 bg-white rounded-lg border border-gray-200 shadow-sm text-gray-900 font-medium group-hover:border-indigo-300 transition-colors">
                                                    {formatCurrency(iotMonthlyCost)}
                                                </span>
                                                <span class="text-xs text-gray-500">/mo</span>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Total Cost Summary -->
                                    <div class="mt-6 pt-4 space-y-4 border-t border-gray-200">
                                        <div class="bg-white rounded-lg p-4 shadow-sm">
                                            <div class="flex items-center justify-between">
                                                <div>
                                                    <div class="text-sm text-gray-600">Monthly Cost</div>
                                                    <div class="text-xs text-gray-500">Before margin</div>
                                                </div>
                                                <div class="text-right">
                                                    <div class="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 text-xl font-semibold text-gray-900">
                                                        {formatCurrency(totalMonthlyCost)}
                                                    </div>
                                                    <div class="text-sm text-gray-500 mt-1">per month</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="bg-white rounded-lg p-4 shadow-sm">
                                            <div class="flex items-center justify-between">
                                                <div>
                                                    <div class="text-sm text-gray-600">Per-Truck Cost</div>
                                                    <div class="text-xs text-gray-500">Base cost</div>
                                                </div>
                                                <div class="text-right">
                                                    <div class="text-lg font-medium text-gray-900">{formatCurrency(costPerTruck)}</div>
                                                    <div class="text-sm text-gray-500">per truck/month</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="bg-white rounded-lg p-4 shadow-sm">
                                            <div class="flex items-center justify-between">
                                                <div>
                                                    <div class="text-sm text-gray-600">Per-Truck with Margin</div>
                                                    <div class="text-xs text-gray-500">Including {formatPercent(profitMarginPercent)} margin</div>
                                                </div>
                                                <div class="text-right">
                                                    <div class="text-lg font-medium text-gray-900">{formatCurrency(costPerTruckWithMargin)}</div>
                                                    <div class="text-sm text-gray-500">per truck/month</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="bg-indigo-50 rounded-lg p-4 shadow-sm mt-4">
                                            <div class="flex items-center justify-between">
                                                <div>
                                                    <div class="text-sm font-medium text-indigo-900">Total Monthly Price</div>
                                                    <div class="text-xs text-indigo-700">For {formatNumber(truckCount)} trucks</div>
                                                </div>
                                                <div class="text-right">
                                                    <div class="px-4 py-2 bg-white rounded-lg border-2 border-indigo-300 shadow-sm">
                                                        <div class="text-2xl font-bold text-indigo-600">{formatCurrency(totalMonthlyPrice)}</div>
                                                    </div>
                                                    <div class="text-sm text-indigo-500 mt-1">per month</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Formula Documentation Section -->
            <div class="w-full lg:w-1/3">
                <div class="bg-white rounded-2xl shadow-xl p-6 space-y-6 sticky top-8">
                    <div class="border-b border-gray-200 pb-4">
                        <h2 class="text-xl font-semibold text-gray-900">Formula Documentation</h2>
                        <p class="text-sm text-gray-500 mt-1">Detailed breakdown of calculations</p>
                    </div>

                    <div class="space-y-6">
                        <!-- Aurora Section -->
                        <div class="formula-section">
                            <h3 class="text-lg font-medium text-gray-900">Aurora Costs</h3>
                            <div class="mt-2 space-y-2 text-sm text-gray-600">
                                <p><strong>Instance Cost:</strong> ${AURORA_INSTANCE_COST}/month (Standard)</p>
                                <p><strong>High Load:</strong> ${AURORA_INSTANCE_COST_HIGH}/month</p>
                                <p><strong>Storage:</strong> ${AURORA_STORAGE_COST_PER_GB}/GB/month</p>
                                <p><strong>Backup:</strong> ${AURORA_BACKUP_COST_PER_GB}/GB/month</p>
                                <div class="bg-gray-50 p-3 rounded-lg mt-2">
                                    <p class="font-mono text-xs">Monthly Cost = Instance Cost + (Storage GB × ${AURORA_STORAGE_COST_PER_GB}) + (Backup GB × ${AURORA_BACKUP_COST_PER_GB})</p>
                                </div>
                            </div>
                        </div>

                        <!-- Kinesis Section -->
                        <div class="formula-section">
                            <h3 class="text-lg font-medium text-gray-900">Kinesis Data Ingestion</h3>
                            <div class="mt-2 space-y-2 text-sm text-gray-600">
                                <p><strong>Base Rate:</strong> ${KINESIS_INGEST_COST_PER_GB}/GB</p>
                                <div class="bg-gray-50 p-3 rounded-lg mt-2">
                                    <p class="font-mono text-xs">Daily GB = (MB per Truck × Trucks) ÷ 1024</p>
                                    <p class="font-mono text-xs">Monthly GB = Daily GB × 30</p>
                                    <p class="font-mono text-xs">Cost = Monthly GB × ${KINESIS_INGEST_COST_PER_GB}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Lambda Section -->
                        <div class="formula-section">
                            <h3 class="text-lg font-medium text-gray-900">Lambda Processing</h3>
                            <div class="mt-2 space-y-2 text-sm text-gray-600">
                                <p><strong>Request Cost:</strong> ${LAMBDA_REQUEST_COST_PER_MILLION}/million</p>
                                <p><strong>Duration:</strong> ${LAMBDA_DURATION_COST_PER_GB_SECOND}/GB-second</p>
                                <div class="bg-gray-50 p-3 rounded-lg mt-2">
                                    <p class="font-mono text-xs">Monthly Invocations = Daily Invocations × Trucks × 30</p>
                                    <p class="font-mono text-xs">Request Cost = (Invocations ÷ 1M) × ${LAMBDA_REQUEST_COST_PER_MILLION}</p>
                                    <p class="font-mono text-xs">GB-Seconds = Invocations × Memory GB × Duration</p>
                                    <p class="font-mono text-xs">Duration Cost = GB-Seconds × ${LAMBDA_DURATION_COST_PER_GB_SECOND}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Redshift Section -->
                        <div class="formula-section">
                            <h3 class="text-lg font-medium text-gray-900">Redshift Analytics</h3>
                            <div class="mt-2 space-y-2 text-sm text-gray-600">
                                <p><strong>Cluster Options:</strong></p>
                                <ul class="list-disc pl-4">
                                    <li>Small: ${REDSHIFT_SMALL_CLUSTER}/month</li>
                                    <li>Medium: ${REDSHIFT_MED_CLUSTER}/month</li>
                                    <li>Large: ${REDSHIFT_LARGE_CLUSTER}/month</li>
                                </ul>
                                <p><strong>Storage:</strong> ${REDSHIFT_STORAGE_COST_PER_TB}/TB/month</p>
                                <div class="bg-gray-50 p-3 rounded-lg mt-2">
                                    <p class="font-mono text-xs">Cost = Cluster Cost + (TB × ${REDSHIFT_STORAGE_COST_PER_TB})</p>
                                </div>
                            </div>
                        </div>

                        <!-- BI Tool Section -->
                        <div class="formula-section">
                            <h3 class="text-lg font-medium text-gray-900">BI Tool Licensing</h3>
                            <div class="mt-2 space-y-2 text-sm text-gray-600">
                                <p><strong>Per User:</strong> ${BI_LICENSE_COST_PER_USER}/month</p>
                                <div class="bg-gray-50 p-3 rounded-lg mt-2">
                                    <p class="font-mono text-xs">Cost = Users × ${BI_LICENSE_COST_PER_USER}</p>
                                </div>
                            </div>
                        </div>

                        <!-- IoT Section -->
                        <div class="formula-section">
                            <h3 class="text-lg font-medium text-gray-900">IoT Device Management</h3>
                            <div class="mt-2 space-y-2 text-sm text-gray-600">
                                <p><strong>Per Device:</strong> ${DEVICE_MANAGEMENT_COST_PER_DEVICE}/month</p>
                                <div class="bg-gray-50 p-3 rounded-lg mt-2">
                                    <p class="font-mono text-xs">Cost = Trucks × ${DEVICE_MANAGEMENT_COST_PER_DEVICE}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    /* Ensure borders are visible */
    .border {
        border-width: 1px !important;
    }
    
    .border-t {
        border-top-width: 1px !important;
    }
    
    .border-b {
        border-bottom-width: 1px !important;
    }
    
    .border-gray-200 {
        border-color: #E5E7EB !important;
    }
    
    /* Ensure background colors */
    .bg-gray-50 {
        background-color: #F9FAFB !important;
    }
    
    .bg-white {
        background-color: #FFFFFF !important;
    }
    
    /* Ensure proper spacing */
    .p-6 {
        padding: 1.5rem !important;
    }
    
    .p-4 {
        padding: 1rem !important;
    }
    
    /* Ensure shadows */
    .shadow-xl {
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
    }
    
    .shadow-sm {
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
    }
    
    /* Dark mode adjustments */
    @media (prefers-color-scheme: dark) {
        .bg-gray-50 {
            background-color: #1F2937 !important;
        }
        
        .bg-white {
            background-color: #111827 !important;
        }
        
        .border-gray-200 {
            border-color: #374151 !important;
        }
        
        .text-gray-900 {
            color: #F9FAFB !important;
        }
        
        .text-gray-600 {
            color: #D1D5DB !important;
        }
    }

    /* Tooltip Styles */
    :global(.tippy-box) {
        @apply bg-gray-900 text-sm font-normal;
    }

    :global(.tippy-box[data-animation='scale']) {
        @apply transform transition-transform duration-200;
    }

    :global(.tippy-content) {
        @apply p-2;
    }

    /* Hover effects */
    .group:hover .group-hover\:border-indigo-300 {
        @apply border-indigo-300;
    }

    .formula-section {
        @apply border-b border-gray-100 pb-4 last:border-0 last:pb-0;
    }
</style>
