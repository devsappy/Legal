# Starts the embedding server the retrieval index uses (EMBED_URL, default http://127.0.0.1:8081).
# bge-m3 covers Hindi, Marathi and Tamil. CPU by default so it never competes with the chat model for VRAM;
# set $env:EMBED_GPU=1 to build the index faster on the GPU.
$model = if ($env:EMBED_HF_MODEL) { $env:EMBED_HF_MODEL } else { "gpustack/bge-m3-GGUF:Q8_0" }
$ngl = if ($env:EMBED_GPU) { 99 } else { 0 }

$llama = Get-Command llama -ErrorAction SilentlyContinue
if (-not $llama) {
  $pkg = Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Packages\ggml.llamacpp_Microsoft.Winget.Source_8wekyb3d8bbwe\llama.exe"
  if (Test-Path $pkg) { $llama = $pkg } else { Write-Error "llama.cpp not found. Run: winget install llama.cpp"; exit 1 }
} else { $llama = $llama.Source }

$extra = @()
if ($env:EMBED_API_KEY) { $extra += @("--api-key", $env:EMBED_API_KEY) }
& $llama serve -hf $model --embedding --pooling cls --host 127.0.0.1 --port 8081 -c 2048 -b 2048 -ub 2048 -ngl $ngl -dev Vulkan0 -a embed @extra
