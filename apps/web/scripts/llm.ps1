# Starts the local llama.cpp server the app talks to (LLM_URL, default http://127.0.0.1:8080).
# Install once:  winget install llama.cpp
# Model: an instruct GGUF that fits the GPU. Override with $env:LLM_HF_MODEL.
$model = if ($env:LLM_HF_MODEL) { $env:LLM_HF_MODEL } else { "unsloth/Qwen3.5-4B-GGUF:Q4_K_M" }
# Two slots share the context, so this is 8k per request; Qwen3.5 KV is small enough for it on 6 GB.
$ctx = if ($env:LLM_CTX) { $env:LLM_CTX } else { 16384 }

$llama = Get-Command llama -ErrorAction SilentlyContinue
if (-not $llama) {
  $pkg = Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Packages\ggml.llamacpp_Microsoft.Winget.Source_8wekyb3d8bbwe\llama.exe"
  if (Test-Path $pkg) { $llama = $pkg } else { Write-Error "llama.cpp not found. Run: winget install llama.cpp"; exit 1 }
} else { $llama = $llama.Source }

# -dev Vulkan0 keeps everything on the discrete GPU; without it llama.cpp also spreads layers onto an Intel iGPU and prefill crawls.
$extra = @()
if ($env:LLM_API_KEY) { $extra += @("--api-key", $env:LLM_API_KEY) }
& $llama serve -hf $model --host 127.0.0.1 --port 8080 -c $ctx -ngl 99 -dev Vulkan0 -fa on --no-mmproj -np 2 --reasoning off -a sahayak @extra
