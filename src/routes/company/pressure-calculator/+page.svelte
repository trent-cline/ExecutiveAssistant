<script lang="ts">
    import { onMount } from 'svelte';
    import Card from '$lib/components/containers/Card.svelte';
    
    let loading = true;
    
    onMount(() => {
        loading = false;
    });
</script>

<svelte:head>
    <title>Pressure Calculator - Pillar Apps</title>
</svelte:head>

<div class="page-container">
    <div class="content">
        <!-- Header Section -->
        <div class="header">
            <div class="header-content">
                <h1>System Pressure Calculator</h1>
                <p>Calculate pressure drop throughout the Trucking coriolis system</p>
            </div>
        </div>
        
        <div class="main-grid">
            <!-- Main Content -->
            <div class="main-content">
                <Card>
                    <div class="calculator-container">
                        <h2>Pressure Drop Calculator</h2>
                        <p class="info-text">This tool will calculate the pressure drop throughout the Trucking coriolis system.</p>
                        
                        <div class="system-visualization">
                            <div class="visualization-header">
                                <h3>System Visualization</h3>
                            </div>
                            <div class="system-diagram">
                                <div class="flow-diagram horizontal">
                                    <!-- Tank Farm (Left) -->
                                    <div class="component tank-farm">
                                        <div class="component-image tank-farm-image">
                                            <div class="image-placeholder">
                                                <i class="fas fa-oil-well"></i>
                                                <span>Tank Farm</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Flow Arrow and Pressure Reading -->
                                    <div class="flow-arrow horizontal">
                                        <i class="fas fa-long-arrow-alt-right"></i>
                                    </div>
                                    
                                    <!-- Trailer with Pump and Coriolis (Middle) -->
                                    <div class="component trailer">
                                        <div class="component-image trailer-image">
                                            <div class="image-placeholder">
                                                <i class="fas fa-truck-container"></i>
                                                <span>Trailer</span>
                                            </div>
                                        </div>
                                        <div class="trailer-components">
                                            <div class="sub-component pump">
                                                <div class="sub-component-image">
                                                    <i class="fas fa-pump"></i>
                                                    <span>Pump</span>
                                                </div>
                                                <!-- Pressure Reading at Pump Input -->
                                                <div class="pump-pressure-reading">
                                                    <input type="text" class="pressure-input" placeholder="-- PSI" />
                                                </div>
                                            </div>
                                            
                                            <!-- Arrow from Pump to Coriolis -->
                                            <div class="internal-flow-arrow">
                                                <i class="fas fa-long-arrow-alt-right"></i>
                                            </div>
                                            
                                            <!-- Pressure Reading Between Pump and Coriolis -->
                                            <div class="internal-pressure-reading">
                                                <div class="pressure-value">
                                                    <input type="text" class="pressure-input" placeholder="-- PSI" />
                                                </div>
                                            </div>
                                            
                                            <div class="sub-component coriolis">
                                                <div class="sub-component-image">
                                                    <i class="fas fa-gauge-high"></i>
                                                    <span>Coriolis</span>
                                                </div>
                                            </div>
                                        </div>
                                        <!-- Arrow from Coriolis Up to Trailer -->
                                        <div class="coriolis-to-trailer-arrow">
                                            <i class="fas fa-long-arrow-alt-up"></i>
                                        </div>
                                    </div>
                                    
                                    <!-- Flow Arrow and Pressure Reading -->
                                    <div class="flow-arrow horizontal">
                                        <i class="fas fa-long-arrow-alt-right"></i>
                                        <div class="pressure-reading">
                                            <div class="pressure-value">
                                                <input type="text" class="pressure-input" placeholder="-- PSI" />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Truck (Right) -->
                                    <div class="component truck">
                                        <div class="component-image">
                                            <div class="image-placeholder">
                                                <i class="fas fa-truck-moving"></i>
                                                <span>Truck</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="calculator-form">
                            <div class="form-section">
                                <h3>Input Parameters</h3>
                                <div class="form-grid">
                                    <!-- Tank Farm Parameters -->
                                    <div class="parameter-group">
                                        <h4>Tank Farm Parameters</h4>
                                        <div class="form-group">
                                            <label for="tankFarmPressure">Initial Pressure (PSI)</label>
                                            <input type="number" id="tankFarmPressure" placeholder="Enter pressure" />
                                        </div>
                                        <div class="form-group">
                                            <label for="tankFarmFlowRate">Flow Rate (bbl/min)</label>
                                            <input type="number" id="tankFarmFlowRate" placeholder="Enter flow rate" />
                                        </div>
                                        <div class="form-group">
                                            <label for="tankFarmTemp">Temperature (°F)</label>
                                            <input type="number" id="tankFarmTemp" placeholder="Enter temperature" />
                                        </div>
                                    </div>
                                    
                                    <!-- Pipeline Parameters -->
                                    <div class="parameter-group">
                                        <h4>Pipeline Parameters</h4>
                                        <div class="form-group">
                                            <label for="pipelineDiameter">Diameter (inches)</label>
                                            <input type="number" id="pipelineDiameter" placeholder="Enter diameter" />
                                        </div>
                                        <div class="form-group">
                                            <label for="pipelineLength">Length (feet)</label>
                                            <input type="number" id="pipelineLength" placeholder="Enter length" />
                                        </div>
                                        <div class="form-group">
                                            <label for="pipelineFriction">Friction Factor</label>
                                            <input type="number" id="pipelineFriction" placeholder="Enter friction factor" step="0.001" />
                                        </div>
                                    </div>
                                    
                                    <!-- Fluid Properties -->
                                    <div class="parameter-group">
                                        <h4>Fluid Properties</h4>
                                        <div class="form-group">
                                            <label for="fluidDensity">Density (lb/ft³)</label>
                                            <input type="number" id="fluidDensity" placeholder="Enter density" />
                                        </div>
                                        <div class="form-group">
                                            <label for="fluidViscosity">Viscosity (cP)</label>
                                            <input type="number" id="fluidViscosity" placeholder="Enter viscosity" />
                                        </div>
                                        <div class="form-group">
                                            <label for="fluidType">Fluid Type</label>
                                            <select id="fluidType">
                                                <option value="crude">Crude Oil</option>
                                                <option value="refined">Refined Product</option>
                                                <option value="water">Water</option>
                                                <option value="custom">Custom</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="calculate-button-container">
                                    <button class="calculate-button">
                                        <i class="fas fa-calculator"></i>
                                        Calculate Pressure Drop
                                    </button>
                                </div>
                            </div>
                            
                            <div class="results-section">
                                <h3>Results</h3>
                                <div class="results-grid">
                                    <div class="result-item">
                                        <div class="result-label">Tank Farm to Truck Pressure Drop:</div>
                                        <div class="result-value">-- PSI</div>
                                    </div>
                                    <div class="result-item">
                                        <div class="result-label">Truck to Crude Tank Pressure Drop:</div>
                                        <div class="result-value">-- PSI</div>
                                    </div>
                                    <div class="result-item">
                                        <div class="result-label">Total System Pressure Drop:</div>
                                        <div class="result-value">-- PSI</div>
                                    </div>
                                    <div class="result-item">
                                        <div class="result-label">Recommended Pump Pressure:</div>
                                        <div class="result-value">-- PSI</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
            
            <!-- Sidebar -->
            <div class="sidebar">
                <Card>
                    <div class="sidebar-section">
                        <h3>About This Tool</h3>
                        <p>The System Pressure Calculator helps you calculate pressure drop throughout the Trucking coriolis system.</p>
                        <p>Current features:</p>
                        <ul>
                            <li>System visualization</li>
                            <li>Component identification</li>
                        </ul>
                        <p>Coming soon:</p>
                        <ul>
                            <li>Pressure drop calculations</li>
                            <li>Flow rate analysis</li>
                            <li>System optimization recommendations</li>
                        </ul>
                    </div>
                </Card>
            </div>
        </div>
    </div>
</div>

<style>
    .page-container {
        min-height: 100vh;
        background-color: #f9fafb;
        padding: 2rem;
    }
    
    .content {
        max-width: 1280px;
        margin: 0 auto;
    }
    
    .header {
        margin-bottom: 2rem;
    }
    
    .header-content h1 {
        font-size: 2rem;
        font-weight: 700;
        color: #111827;
        margin-bottom: 0.5rem;
    }
    
    .header-content p {
        color: #6b7280;
        font-size: 1.125rem;
    }
    
    .main-grid {
        display: grid;
        grid-template-columns: 1fr 300px;
        gap: 1.5rem;
    }
    
    .calculator-container {
        padding: 1rem;
    }
    
    .calculator-container h2 {
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 1rem;
        color: #111827;
    }
    
    .info-text {
        color: #6b7280;
        margin-bottom: 1.5rem;
    }
    
    .system-visualization {
        margin-bottom: 2rem;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        overflow: hidden;
    }
    
    .visualization-header {
        background-color: #f3f4f6;
        padding: 0.75rem 1rem;
        border-bottom: 1px solid #e5e7eb;
    }
    
    .visualization-header h3 {
        font-size: 1.125rem;
        font-weight: 600;
        color: #374151;
        margin: 0;
    }
    
    .system-diagram {
        padding: 1.5rem;
    }
    
    .flow-diagram {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    
    .flow-diagram.horizontal {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
    }
    
    .component {
        margin-bottom: 1rem;
        min-width: 120px;
    }
    
    .component.trailer {
        min-width: 300px;
        width: 40%;
    }
    
    .component.tank-farm {
        min-width: 200px;
        width: 30%;
    }
    
    .component-image {
        padding: 1rem;
    }
    
    .trailer-image {
        padding: 1.5rem;
    }
    
    .tank-farm-image {
        padding: 2rem;
    }
    
    .image-placeholder {
        height: 100px;
        background-color: #f9fafb;
        border-radius: 0.25rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #6b7280;
        border: 1px solid #e5e7eb;
    }
    
    .image-placeholder i {
        font-size: 2rem;
        margin-bottom: 0.5rem;
    }
    
    .trailer-image .image-placeholder {
        height: 120px;
        border-radius: 0.5rem;
        position: relative;
    }
    
    .trailer-image .image-placeholder::before {
        content: '';
        position: absolute;
        bottom: -10px;
        left: 10%;
        width: 80%;
        height: 10px;
        background-color: #6b7280;
        border-radius: 0 0 4px 4px;
    }
    
    .tank-farm-image .image-placeholder {
        height: 130px;
        position: relative;
    }
    
    .tank-farm-image .image-placeholder::before {
        content: '';
        position: absolute;
        bottom: -5px;
        left: 20%;
        width: 60%;
        height: 5px;
        background-color: #6b7280;
        border-radius: 0 0 4px 4px;
    }
    
    .tank-farm-image .image-placeholder i {
        font-size: 2.5rem;
    }
    
    .trailer-components {
        display: flex;
        justify-content: space-between;
        margin-top: 1.5rem;
        padding: 0 1rem;
    }
    
    .sub-component {
        text-align: center;
        padding: 0.5rem;
        background-color: #f3f4f6;
        border-radius: 0.25rem;
        border: 1px dashed #d1d5db;
        margin: 0 0.25rem;
    }
    
    .sub-component-image {
        display: flex;
        flex-direction: column;
        align-items: center;
        font-size: 0.75rem;
    }
    
    .sub-component-image i {
        font-size: 1.25rem;
        margin-bottom: 0.25rem;
    }
    
    .flow-arrow {
        display: flex;
        align-items: center;
        margin-bottom: 1rem;
    }
    
    .flow-arrow.horizontal {
        margin: 0 0.5rem;
        flex-direction: column;
    }
    
    .flow-arrow i {
        font-size: 2rem;
        margin-right: 0.5rem;
    }
    
    .flow-arrow.horizontal i {
        margin-right: 0;
        margin-bottom: 0.5rem;
    }
    
    .pressure-reading {
        display: flex;
        align-items: center;
    }
    
    .flow-arrow.horizontal .pressure-reading {
        text-align: center;
    }
    
    .pressure-input {
        width: 80px;
        text-align: center;
        padding: 0.25rem 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 0.25rem;
        font-weight: 600;
        font-size: 0.875rem;
        color: #111827;
        background-color: white;
    }
    
    .pressure-input:focus {
        outline: none;
        border-color: #4f46e5;
        box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
    }
    
    .internal-pressure-reading {
        margin: 0 0.5rem;
        display: flex;
        align-items: center;
    }
    
    .internal-pressure-reading .pressure-input {
        width: 70px;
        font-size: 0.75rem;
    }
    
    .pump-pressure-reading {
        margin: 0 0.5rem;
        display: flex;
        align-items: center;
    }
    
    .pump-pressure-reading .pressure-input {
        width: 70px;
        font-size: 0.75rem;
    }
    
    .internal-flow-arrow {
        display: flex;
        align-items: center;
        margin: 0 0.5rem;
    }
    
    .internal-flow-arrow i {
        font-size: 1.25rem;
        color: #6b7280;
    }
    
    .coriolis-to-trailer-arrow {
        display: flex;
        justify-content: center;
        margin-top: 0.5rem;
    }
    
    .coriolis-to-trailer-arrow i {
        font-size: 1.5rem;
        color: #6b7280;
    }
    
    .calculator-form {
        margin-top: 2rem;
    }
    
    .form-section, .results-section {
        margin-bottom: 1.5rem;
    }
    
    .form-section h3, .results-section h3 {
        font-size: 1.125rem;
        font-weight: 600;
        color: #374151;
        margin-bottom: 1rem;
    }
    
    .form-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1.5rem;
        margin-bottom: 1.5rem;
    }
    
    .parameter-group {
        background-color: #f9fafb;
        border-radius: 0.5rem;
        padding: 1rem;
        border: 1px solid #e5e7eb;
    }
    
    .parameter-group h4 {
        font-size: 1rem;
        font-weight: 600;
        color: #374151;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid #e5e7eb;
    }
    
    .form-group {
        margin-bottom: 1rem;
    }
    
    .form-group label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        color: #4b5563;
        margin-bottom: 0.25rem;
    }
    
    .form-group input, .form-group select {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        color: #111827;
        background-color: white;
    }
    
    .form-group input:focus, .form-group select:focus {
        outline: none;
        border-color: #4f46e5;
        box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
    }
    
    .calculate-button-container {
        display: flex;
        justify-content: center;
        margin-top: 1rem;
    }
    
    .calculate-button {
        background-color: #4f46e5;
        color: white;
        font-weight: 600;
        padding: 0.75rem 1.5rem;
        border-radius: 0.375rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        cursor: pointer;
        transition: background-color 0.2s;
    }
    
    .calculate-button:hover {
        background-color: #4338ca;
    }
    
    .calculate-button i {
        margin-right: 0.5rem;
    }
    
    .results-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
    }
    
    .result-item {
        background-color: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 0.375rem;
        padding: 1rem;
    }
    
    .result-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: #4b5563;
        margin-bottom: 0.5rem;
    }
    
    .result-value {
        font-size: 1.25rem;
        font-weight: 600;
        color: #111827;
    }
    
    .sidebar-section {
        padding: 1rem;
    }
    
    .sidebar-section h3 {
        font-size: 1.125rem;
        font-weight: 600;
        color: #111827;
        margin-bottom: 1rem;
    }
    
    .sidebar-section p {
        color: #4b5563;
        margin-bottom: 1rem;
    }
    
    .sidebar-section ul {
        padding-left: 1.5rem;
        margin-bottom: 1rem;
    }
    
    .sidebar-section li {
        color: #4b5563;
        margin-bottom: 0.5rem;
    }
    
    @media (max-width: 768px) {
        .main-grid {
            grid-template-columns: 1fr;
        }
        
        .form-grid {
            grid-template-columns: 1fr;
        }
        
        .results-grid {
            grid-template-columns: 1fr;
        }
    }
    
    @media (prefers-color-scheme: dark) {
        .page-container {
            background-color: #111827;
        }
        
        .header-content h1 {
            color: #f9fafb;
        }
        
        .header-content p {
            color: #9ca3af;
        }
        
        .calculator-container h2 {
            color: #f9fafb;
        }
        
        .info-text {
            color: #9ca3af;
        }
        
        .visualization-header {
            background-color: #1f2937;
            border-color: #374151;
        }
        
        .visualization-header h3 {
            color: #e5e7eb;
        }
        
        .system-visualization {
            border-color: #374151;
        }
        
        .component {
            border-color: #374151;
        }
        
        .component-image {
            background-color: #1f2937;
        }
        
        .image-placeholder {
            background-color: #111827;
            color: #9ca3af;
        }
        
        .flow-arrow i {
            color: #e5e7eb;
        }
        
        .form-section h3, .results-section h3 {
            color: #e5e7eb;
        }
        
        .parameter-group {
            background-color: #1f2937;
            border-color: #374151;
        }
        
        .parameter-group h4 {
            color: #e5e7eb;
            border-color: #374151;
        }
        
        .form-group label {
            color: #9ca3af;
        }
        
        .form-group input, .form-group select {
            background-color: #111827;
            border-color: #374151;
            color: #e5e7eb;
        }
        
        .form-group input:focus, .form-group select:focus {
            border-color: #6366f1;
            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
        }
        
        .result-item {
            background-color: #1f2937;
            border-color: #374151;
        }
        
        .result-label {
            color: #9ca3af;
        }
        
        .result-value {
            color: #e5e7eb;
        }
        
        .sidebar-section h3 {
            color: #f9fafb;
        }
        
        .sidebar-section p, .sidebar-section li {
            color: #9ca3af;
        }
    }
</style>
