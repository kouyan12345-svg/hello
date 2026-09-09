(() => {
  const raw = document.getElementById("project-data")?.textContent || "{}";
  let project = {};
  try{ project = JSON.parse(raw); }catch(e){ console.error("project data error",e); }

  const page = document.getElementById("page");
  const overlay = document.getElementById("overlay");
  const content = document.getElementById("overlayContent");
  const players = new Map();

  const designWidth = Math.max(320, Number(project.designWidth || 720));
  const designHeight = Math.max(300, Number(project.designHeight || project.pageHeight || 600));
  const fixedViewportMode =
    project.background?.type &&
    project.background.type !== "template" &&
    (project.background?.fit === "cover" || project.background?.fit === "stretch");

  const shell = document.createElement("div");
  shell.id = "stageShell";
  shell.className = fixedViewportMode ? "fixed-stage-shell" : "scroll-stage-shell";

  const oldPage = page;
  oldPage.parentNode.insertBefore(shell, oldPage);
  shell.appendChild(oldPage);

  page.style.width = `${designWidth}px`;
  page.style.height = `${designHeight}px`;
  page.style.minHeight = "0";
  page.style.position = "absolute";
  page.style.left = "0";
  page.style.top = "0";
  page.style.transformOrigin = "top left";

  document.body.className = `template-${project.template || "simple"}`;

  let layoutScale = 1;
  function fitStage(){
    if(fixedViewportMode){
      layoutScale = Math.min(window.innerWidth / designWidth, window.innerHeight / designHeight);
      page.style.left = "50%";
      page.style.top = "50%";
      page.style.transformOrigin = "center center";
      page.style.transform = `translate(-50%,-50%) scale(${layoutScale})`;
      shell.style.height = "100vh";
    }else{
      layoutScale = window.innerWidth / designWidth;
      page.style.left = "0";
      page.style.top = "0";
      page.style.transformOrigin = "top left";
      page.style.transform = `scale(${layoutScale})`;
      shell.style.height = `${designHeight * layoutScale}px`;
    }
  }
  fitStage();
  window.addEventListener("resize", fitStage);

  const bgFit = project.background?.fit || "cover";
  const applyBgStyle = node => {
    node.style.position = "absolute";
    node.style.inset = "0";
    node.style.width = "100%";
    node.style.height = "100%";
    node.style.objectFit = bgFit === "stretch" ? "fill" : "cover";
    node.style.zIndex = "-10";
  };

  if(project.background?.type === "image" && project.background.assetUrl){
    const img = document.createElement("img");
    img.className = "site-bg";
    img.src = project.background.assetUrl;
    applyBgStyle(img);
    page.prepend(img);
  }else if(project.background?.type === "video" && project.background.assetUrl){
    const v = document.createElement("video");
    v.className = "site-bg";
    v.src = project.background.assetUrl;
    v.autoplay = true;
    v.muted = true;
    v.dataset.wantSound = project.background.sound ? "1" : "0";
    v.loop = true;
    v.playsInline = true;
    applyBgStyle(v);
    page.prepend(v);
    v.play().catch(()=>{});
  }

  const soundBg = document.querySelector('.site-bg[data-want-sound="1"]');
  if(soundBg){
    const soundBtn = document.createElement("button");
    soundBtn.id = "bgSoundToggle";
    soundBtn.textContent = "🔊 背景音をON";
    document.body.appendChild(soundBtn);
    soundBtn.addEventListener("click", async () => {
      soundBg.muted = !soundBg.muted;
      if(!soundBg.muted){
        try{ await soundBg.play(); }
        catch(e){ soundBg.muted = true; }
      }
      soundBtn.textContent = soundBg.muted ? "🔊 背景音をON" : "🔇 背景音をOFF";
    });
  }

  function animClass(a){ return a && a !== "none" ? ` anim-${a}` : ""; }

  for(const el of (project.elements || [])){
    let node;
    if(el.kind === "image"){
      node = document.createElement("img");
      node.src = el.src || "";
      node.alt = "";
    }else if(el.kind === "video"){
      node = document.createElement("video");
      node.src = el.src || "";
      node.controls = true;
      node.playsInline = true;
      node.preload = "metadata";
    }else if(el.kind === "button"){
      node = document.createElement("div");
      if(el.buttonVisual === "image" && el.buttonMediaUrl){
        node.classList.add("visual-image");
        const img = document.createElement("img");
        img.className = "button-media";
        img.src = el.buttonMediaUrl;
        node.appendChild(img);
        const label = document.createElement("span");
        label.className = "button-label";
        label.textContent = el.text || "";
        node.appendChild(label);
      }else if(el.buttonVisual === "video" && el.buttonMediaUrl){
        node.classList.add("visual-video");
        const v = document.createElement("video");
        v.className = "button-media";
        v.src = el.buttonMediaUrl;
        v.autoplay = true;
        v.muted = true;
        v.loop = true;
        v.playsInline = true;
        v.controls = false;
        v.disablePictureInPicture = true;
        v.disableRemotePlayback = true;
        v.setAttribute("disablepictureinpicture", "");
        v.setAttribute("controlslist", "nodownload noplaybackrate noremoteplayback");
        node.appendChild(v);
        const label = document.createElement("span");
        label.className = "button-label";
        label.textContent = el.text || "";
        node.appendChild(label);
        v.play().catch(()=>{});
      }else{
        node.textContent = el.text || "";
      }
    }else{
      node = document.createElement("div");
      node.textContent = el.text || "";
    }

    node.id = el.id || "";
    const visualClass = el.kind === "button" && el.buttonVisual ? ` visual-${el.buttonVisual}` : "";
    node.className += ` item kind-${el.kind}${visualClass}${animClass(el.animation)}`;
    node.style.left = `${Number(el.x)||0}px`;
    node.style.top = `${Number(el.y)||0}px`;
    node.style.width = `${Number(el.width)||100}px`;
    node.style.height = `${Number(el.height)||50}px`;
    node.style.fontSize = `${Math.max(8, Number(el.fontSize || (el.kind==="text" ? 30 : 16)))}px`;
    node.style.fontFamily = ({
      system:'system-ui,-apple-system,"Segoe UI",sans-serif',
      gothic:'"Yu Gothic","Hiragino Kaku Gothic ProN",Meiryo,sans-serif',
      mincho:'"Yu Mincho","Hiragino Mincho ProN","MS PMincho",serif',
      rounded:'"Hiragino Maru Gothic ProN","Yu Gothic",Meiryo,sans-serif',
      monospace:'ui-monospace,Consolas,"Courier New",monospace'
    })[el.fontFamily || "system"] || 'system-ui,-apple-system,"Segoe UI",sans-serif';

    node.addEventListener("click", () => {
      for(const action of (el.actions || [])) runAction(node, action);
      if(el.href) window.open(el.href, "_blank", "noopener");
    });
    page.appendChild(node);
  }

  function closeOverlay(){
    content.querySelectorAll("video,audio").forEach(m=>{try{m.pause()}catch(e){}});
    content.innerHTML = "";
    overlay.classList.remove("show");
  }

  document.getElementById("overlayClose").addEventListener("click", closeOverlay);
  overlay.addEventListener("click", e => { if(e.target === overlay) closeOverlay(); });

  function getAudio(src){
    let audio = players.get(src);
    if(!audio){
      audio = new Audio(src);
      audio.preload = "auto";
      players.set(src,audio);
    }
    return audio;
  }

  async function playSound(src){
    if(!src) return;
    const audio = getAudio(src);
    try{
      audio.pause();
      audio.currentTime = 0;
      await audio.play();
    }catch(err){
      console.error("Audio playback failed:",err);
      alert("音声を再生できませんでした。ファイル形式やブラウザの音量設定を確認してください。");
    }
  }

  function stopAllAudio(){
    for(const audio of players.values()){
      try{ audio.pause(); audio.currentTime = 0; }catch(e){}
    }
  }

  function runAction(el,a){
    if(a.type === "playAudio") playSound(a.assetUrl);
    if(a.type === "stopAudio") stopAllAudio();

    if(a.type === "showVideo" && a.assetUrl){
      content.innerHTML = "";
      const v = document.createElement("video");
      v.src = a.assetUrl;
      v.controls = true;
      v.autoplay = true;
      v.playsInline = true;
      content.appendChild(v);
      overlay.classList.add("show");
      v.play().catch(()=>{});
    }

    if(a.type === "showImage" && a.assetUrl){
      content.innerHTML = "";
      const img = document.createElement("img");
      img.src = a.assetUrl;
      content.appendChild(img);
      overlay.classList.add("show");
    }

    if(a.type === "openUrl" && a.url) window.open(a.url, "_blank", "noopener");
    if(a.type === "changeText") el.textContent = a.text || "";
    if(a.type === "scrollTo") window.scrollTo({top:(Number(a.y)||0) * layoutScale, behavior:"smooth"});
  }
})();
