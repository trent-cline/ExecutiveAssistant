<script lang="ts">
    import { signIn, isLoading, user } from '$lib/auth';
    import { onMount } from 'svelte';

    let email = '';
    let password = '';
    let error = '';
    let loading = false;

    async function handleLogin(event: SubmitEvent) {
        event.preventDefault();
        loading = true;
        error = '';

        if (!email || !password) {
            error = 'Please enter both email and password';
            loading = false;
            return;
        }

        try {
            console.log('Attempting to sign in with:', { email });
            const result = await signIn(email, password);
            
            // Make sure result is defined before accessing properties
            if (result && !result.success) {
                // Handle specific error cases with user-friendly messages
                const errorMsg = result.error || '';
                
                if (errorMsg.includes('network') || errorMsg.includes('connect')) {
                    error = 'Network error: Please check your internet connection and try again';
                } else if (errorMsg.includes('credentials') || errorMsg.includes('password')) {
                    error = 'Invalid credentials: Please check your email and password';
                } else {
                    error = errorMsg || 'Failed to sign in';
                }
                console.error('Login error:', error);
            } else if (result) {
                console.log('Login successful, redirecting...');
            } else {
                error = 'An unexpected error occurred during login';
                console.error('Login failed with undefined result');
            }
        } catch (e) {
            console.error('Unexpected login error:', e);
            error = e instanceof Error ? e.message : 'An unexpected error occurred';
        } finally {
            loading = false;
        }
    }
</script>

<div class="login-container">
    <div class="login-box">
        <h1>Login</h1>
        
        {#if error}
            <div class="error">
                {error}
            </div>
        {/if}

        <form on:submit|preventDefault={handleLogin}>
            <div class="form-group">
                <label for="email">Email</label>
                <input
                    type="email"
                    id="email"
                    bind:value={email}
                    required
                    disabled={$isLoading}
                />
            </div>

            <div class="form-group">
                <label for="password">Password</label>
                <input
                    type="password"
                    id="password"
                    bind:value={password}
                    required
                    disabled={$isLoading}
                />
            </div>

            <button type="submit" disabled={$isLoading}>
                {$isLoading ? 'Logging in...' : 'Login'}
            </button>
        </form>
    </div>
</div>

<style>
    .login-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        padding: 1rem;
        background-color: #f5f5f5;
    }

    .login-box {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        width: 100%;
        max-width: 400px;
    }

    h1 {
        margin: 0 0 1.5rem;
        text-align: center;
        color: #333;
    }

    .form-group {
        margin-bottom: 1rem;
    }

    label {
        display: block;
        margin-bottom: 0.5rem;
        color: #666;
    }

    input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
    }

    input:focus {
        outline: none;
        border-color: #0066cc;
    }

    button {
        width: 100%;
        padding: 0.75rem;
        background-color: #0066cc;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 1rem;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    button:hover:not(:disabled) {
        background-color: #0052a3;
    }

    button:disabled {
        background-color: #ccc;
        cursor: not-allowed;
    }

    .error {
        background-color: #fff2f2;
        border: 1px solid #ffcdd2;
        color: #d32f2f;
        padding: 0.75rem;
        border-radius: 4px;
        margin-bottom: 1rem;
    }
</style>
