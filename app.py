import os
import subprocess
import base64
import gradio as gr

def build_project():
    """Runs the npm run build command to compile data into dist/index.html"""
    print("🔨 Building Tactical Atlas...")
    try:
        subprocess.run(["npm", "run", "build"], check=True)
        print("✓ Build successful.")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Build failed: {e}")
        return False

def load_atlas_html():
    """Reads dist/index.html and converts it to a base64 encoded data URI string"""
    build_project()
    dist_path = os.path.join("dist", "index.html")
    if not os.path.exists(dist_path):
        err_html = "<h3>Error: dist/index.html not found. Build failed.</h3>"
        return base64.b64encode(err_html.encode('utf-8')).decode('utf-8')
    
    with open(dist_path, "r", encoding="utf-8") as f:
        html_content = f.read()
    
    # Base64 encode the HTML to bypass sandbox/CORS/CSP blocks on Gradio public links
    b64_html = base64.b64encode(html_content.encode('utf-8')).decode('utf-8')
    return b64_html

# Initialize content
b64_html_content = load_atlas_html()

# Custom CSS to make the app looks neat and responsive
custom_css = """
.gradio-container {
    max-width: 100% !important;
    padding: 0 !important;
}
footer {
    display: none !important;
}
"""

with gr.Blocks(title="Tactical Atlas Sim") as demo:
    gr.Markdown(
        """
        # 🗺️ TACTICAL ATLAS (전술 작전도 시뮬레이터)
        전쟁사를 시간축 위에서 재현하는 오픈소스 작전도 시뮬레이터입니다.
        Below is the interactive map simulation.
        """
    )
    
    # Render inside an iframe using src data URI so it works perfectly even over sandboxed Gradio public share links
    iframe_view = gr.HTML(
        value=f'<iframe src="data:text/html;charset=utf-8;base64,{b64_html_content}" sandbox="allow-scripts allow-same-origin allow-popups allow-downloads" style="width: 100%; height: 85vh; border: 2px solid #ccc; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"></iframe>'
    )
    
    with gr.Row():
        rebuild_btn = gr.Button("🔄 시뮬레이터 데이터 갱신 (Rebuild & Refresh)", variant="primary")
    
    def refresh_app():
        new_b64 = load_atlas_html()
        return f'<iframe src="data:text/html;charset=utf-8;base64,{new_b64}" sandbox="allow-scripts allow-same-origin allow-popups allow-downloads" style="width: 100%; height: 85vh; border: 2px solid #ccc; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"></iframe>'
        
    rebuild_btn.click(
        fn=refresh_app,
        outputs=[iframe_view]
    )

if __name__ == "__main__":
    # Launch Gradio with sharing enabled. 
    # This automatically generates a public xxxx.gradio.live link!
    demo.launch(share=True, css=custom_css)
