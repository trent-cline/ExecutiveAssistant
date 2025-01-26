<!-- src/routes/company/cloud-costs/+page.svelte -->
<script lang="ts">
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
</script>

<div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
        <div class="text-center mb-12">
            <h1 class="text-4xl font-bold text-gray-900 mb-2">Cloud Cost Calculator</h1>
            <p class="text-lg text-gray-600">Estimate your AWS infrastructure costs with real-time calculations</p>
        </div>

        <div class="grid lg:grid-cols-3 gap-8">
            <!-- Input Form -->
            <div class="lg:col-span-2">
                <div class="bg-white rounded-2xl shadow-xl p-6 space-y-6">
                    <div class="border-b pb-4">
                        <h2 class="text-xl font-semibold text-gray-900">Infrastructure Details</h2>
                        <p class="text-sm text-gray-500 mt-1">Configure your cloud resources and requirements</p>
                    </div>

                    <form class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Trucks and Telemetry -->
                        <div class="space-y-6">
                            <h3 class="text-sm font-medium text-gray-900 uppercase tracking-wider">Basic Configuration</h3>
                            <div class="space-y-4">
                                <div class="form-group">
                                    <label for="truckCount" class="block text-sm font-medium text-gray-700 mb-1">Number of Trucks</label>
                                    <input id="truckCount" type="number" bind:value={truckCount} min="1" 
                                        class="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>
                                <div class="form-group">
                                    <label for="telemetryMB" class="block text-sm font-medium text-gray-700 mb-1">Telemetry MB/Truck/Day</label>
                                    <input id="telemetryMB" type="number" bind:value={telemetryMBPerTruckPerDay} min="0" 
                                        class="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>
                            </div>
                        </div>

                        <!-- Aurora Section -->
                        <div class="space-y-6">
                            <h3 class="text-sm font-medium text-gray-900 uppercase tracking-wider">Aurora Database</h3>
                            <div class="space-y-4">
                                <div class="form-group">
                                    <label for="auroraInstance" class="block text-sm font-medium text-gray-700 mb-1">Monthly Instance Cost ($)</label>
                                    <input id="auroraInstance" type="number" bind:value={auroraInstanceCost} min="0" step="0.01" 
                                        class="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>
                                <div class="form-group">
                                    <label for="auroraStorage" class="block text-sm font-medium text-gray-700 mb-1">Storage (GB)</label>
                                    <input id="auroraStorage" type="number" bind:value={auroraStorageGB} min="0" step="0.01" 
                                        class="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>
                                <div class="form-group">
                                    <label for="auroraBackup" class="block text-sm font-medium text-gray-700 mb-1">Backup (GB)</label>
                                    <input id="auroraBackup" type="number" bind:value={auroraBackupGB} min="0" step="0.01" 
                                        class="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>
                            </div>
                        </div>

                        <!-- Lambda Section -->
                        <div class="space-y-6">
                            <h3 class="text-sm font-medium text-gray-900 uppercase tracking-wider">Lambda Functions</h3>
                            <div class="space-y-4">
                                <div class="form-group">
                                    <label for="lambdaInvocations" class="block text-sm font-medium text-gray-700 mb-1">Invocations/Truck/Day</label>
                                    <input id="lambdaInvocations" type="number" bind:value={lambdaInvocationsPerTruckPerDay} min="0" 
                                        class="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>
                                <div class="form-group">
                                    <label for="lambdaMemory" class="block text-sm font-medium text-gray-700 mb-1">Memory (MB)</label>
                                    <input id="lambdaMemory" type="number" bind:value={lambdaMemoryMB} min="0" 
                                        class="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>
                                <div class="form-group">
                                    <label for="lambdaDuration" class="block text-sm font-medium text-gray-700 mb-1">Avg Duration (ms)</label>
                                    <input id="lambdaDuration" type="number" bind:value={lambdaAvgDurationMs} min="0" 
                                        class="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>
                            </div>
                        </div>

                        <!-- Redshift Section -->
                        <div class="space-y-6">
                            <h3 class="text-sm font-medium text-gray-900 uppercase tracking-wider">Redshift</h3>
                            <div class="space-y-4">
                                <div class="form-group">
                                    <label for="redshiftCluster" class="block text-sm font-medium text-gray-700 mb-1">Monthly Cluster Cost ($)</label>
                                    <input id="redshiftCluster" type="number" bind:value={redshiftClusterCost} min="0" step="0.01" 
                                        class="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>
                                <div class="form-group">
                                    <label for="redshiftStorage" class="block text-sm font-medium text-gray-700 mb-1">Storage (TB)</label>
                                    <input id="redshiftStorage" type="number" bind:value={redshiftStorageTB} min="0" step="0.01" 
                                        class="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>
                            </div>
                        </div>

                        <!-- Additional Services -->
                        <div class="space-y-6">
                            <h3 class="text-sm font-medium text-gray-900 uppercase tracking-wider">Additional Services</h3>
                            <div class="space-y-4">
                                <div class="form-group">
                                    <label for="biUsers" class="block text-sm font-medium text-gray-700 mb-1">BI Users</label>
                                    <input id="biUsers" type="number" bind:value={numberOfBIUsers} min="0" 
                                        class="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>
                                <div class="form-group">
                                    <label for="iotCost" class="block text-sm font-medium text-gray-700 mb-1">IoT Device Cost/Truck ($)</label>
                                    <input id="iotCost" type="number" bind:value={iotDeviceCostPerDevice} min="0" step="0.01" 
                                        class="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>
                                <div class="form-group">
                                    <label for="profitMargin" class="block text-sm font-medium text-gray-700 mb-1">Profit Margin (%)</label>
                                    <input id="profitMargin" type="number" bind:value={profitMarginPercent} min="0" step="1" 
                                        class="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Results Panel -->
            <div class="lg:col-span-1">
                <div class="bg-white rounded-2xl shadow-xl p-6 space-y-6 sticky top-8">
                    <div class="border-b pb-4">
                        <h2 class="text-xl font-semibold text-gray-900">Cost Summary</h2>
                        <p class="text-sm text-gray-500 mt-1">Monthly cost breakdown</p>
                    </div>

                    <div class="space-y-4">
                        <div class="grid grid-cols-2 gap-2 text-sm">
                            <div class="text-gray-600">Aurora:</div>
                            <div class="text-gray-900 font-medium text-right">${auroraMonthlyCost.toFixed(2)}</div>
                            
                            <div class="text-gray-600">Kinesis:</div>
                            <div class="text-gray-900 font-medium text-right">${kinesisMonthlyCost.toFixed(2)}</div>
                            
                            <div class="text-gray-600">Lambda:</div>
                            <div class="text-gray-900 font-medium text-right">${lambdaMonthlyCost.toFixed(2)}</div>
                            
                            <div class="text-gray-600">Redshift:</div>
                            <div class="text-gray-900 font-medium text-right">${redshiftMonthlyCost.toFixed(2)}</div>
                            
                            <div class="text-gray-600">BI Tool:</div>
                            <div class="text-gray-900 font-medium text-right">${biMonthlyCost.toFixed(2)}</div>
                            
                            <div class="text-gray-600">IoT Devices:</div>
                            <div class="text-gray-900 font-medium text-right">${iotMonthlyCost.toFixed(2)}</div>
                        </div>

                        <div class="border-t pt-4 space-y-3">
                            <div>
                                <div class="text-sm text-gray-600">Monthly Cost (No Margin)</div>
                                <div class="text-xl font-semibold text-gray-900">${totalMonthlyCost.toFixed(2)}</div>
                            </div>

                            <div>
                                <div class="text-sm text-gray-600">Per-Truck Cost</div>
                                <div class="text-lg font-medium text-gray-900">${costPerTruck.toFixed(2)}/truck/month</div>
                            </div>

                            <div>
                                <div class="text-sm text-gray-600">Per-Truck with {profitMarginPercent}% Margin</div>
                                <div class="text-lg font-medium text-gray-900">${costPerTruckWithMargin.toFixed(2)}/truck/month</div>
                            </div>

                            <div class="pt-3">
                                <div class="text-sm text-gray-600">Total Monthly Price</div>
                                <div class="text-2xl font-bold text-green-600">${totalMonthlyPrice.toFixed(2)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
