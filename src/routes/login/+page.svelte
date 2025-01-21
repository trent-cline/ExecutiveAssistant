<script lang="ts">
    import { supabase } from '$lib/supabase';
    import { goto } from '$app/navigation';
    import { user } from '$lib/auth';

    let email = '';
    let password = '';
    let loading = false;
    let error = '';

    async function handleLogin() {
        try {
            loading = true;
            error = '';
            
            const { data, error: err } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (err) throw err;
            
            if (data.session) {
                goto('/');
            }
        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    // Redirect if already logged in
    user.subscribe((value) => {
        if (value) {
            goto('/');
        }
    });
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
                    disabled={loading}
                />
            </div>

            <div class="form-group">
                <label for="password">Password</label>
                <input
                    type="password"
                    id="password"
                    bind:value={password}
                    required
                    disabled={loading}
                />
            </div>

            <button type="submit" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
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
