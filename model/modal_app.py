import modal

app = modal.App("ielts-scoring-api")

# Image dibangun dari Dockerfile yang sudah ada (deps + pre-download model embedding)
image = modal.Image.from_dockerfile("Dockerfile")


@app.function(
    image=image,
    cpu=1,
    memory=1536,  # MiB
    timeout=300,
    scaledown_window=300,  # idle 5 menit → scale to zero (hemat kredit)
)
@modal.web_server(7860, startup_timeout=600)
def serve():
    import subprocess

    subprocess.Popen([
        "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860",
    ])
