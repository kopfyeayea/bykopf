        // Shared birthday check + intro trigger
        const isBirthday = (() => {
            const manila = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
            return manila.getMonth() === 4 && manila.getDate() === 14;
        })();

        function startIntro() {
            document.body.classList.add('intro-ready');
        }

        if (!isBirthday) startIntro();

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        document.getElementById('canvas-container').appendChild(renderer.domElement);

        const globeGroup = new THREE.Group();
        scene.add(globeGroup);

        const radius = 4.2;
        const nodeCount = 60;
        const nodes = [];

        // 1. Earth Wireframe
        const sphereGeo = new THREE.SphereGeometry(radius, 45, 45);
        const sphereMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true,
            transparent: true,
            opacity: 0.02
        });
        const sphere = new THREE.Mesh(sphereGeo, sphereMat);
        globeGroup.add(sphere);

        // 2. Glowing Nodes (additive blend for glow)
        const nodeGeo = new THREE.SphereGeometry(0.05, 16, 16);
        const nodeMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });

        // Outer glow halo per node
        const haloGeo = new THREE.SphereGeometry(0.15, 12, 12);
        const haloMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.12,
            blending: THREE.AdditiveBlending
        });

        for (let i = 0; i < nodeCount; i++) {
            const phi = Math.acos(-1 + (2 * i) / nodeCount);
            const theta = Math.sqrt(nodeCount * Math.PI) * phi;

            const node = new THREE.Mesh(nodeGeo, nodeMat);
            node.position.setFromSphericalCoords(radius, phi, theta);
            globeGroup.add(node);

            const halo = new THREE.Mesh(haloGeo, haloMat);
            halo.position.copy(node.position);
            globeGroup.add(halo);

            nodes.push(node.position);
        }

        // 3. Glowing Link Lines
        const lineMat = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.18,
            blending: THREE.AdditiveBlending
        });
        const lineMaxDist = 2.8;

        for (let i = 0; i < nodeCount; i++) {
            for (let j = i + 1; j < nodeCount; j++) {
                const dist = nodes[i].distanceTo(nodes[j]);
                if (dist < lineMaxDist) {
                    const lineGeo = new THREE.BufferGeometry().setFromPoints([nodes[i], nodes[j]]);
                    const line = new THREE.Line(lineGeo, lineMat);
                    globeGroup.add(line);
                }
            }
        }

        camera.position.z = 10;

        // Mouse Logic
        let mouseX = 0, mouseY = 0;

        const lavaContainer = document.querySelector('.lava-container');
        document.addEventListener('mousemove', (e) => {
            mouseX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
            mouseY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
            lavaContainer.style.transform = `translate(${mouseX * -20}px, ${mouseY * -15}px)`;
        });

        function animate() {
            requestAnimationFrame(animate);
            globeGroup.rotation.y += (mouseX * 0.3 - globeGroup.rotation.y) * 0.05;
            globeGroup.rotation.x += (mouseY * 0.3 - globeGroup.rotation.x) * 0.05;
            globeGroup.rotation.y += 0.0008;

            renderer.render(scene, camera);
        }

        function updateGmtTime() {
            const now = new Date();
            const format = new Intl.DateTimeFormat('en-US', {
                hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Manila'
            });
            document.getElementById('gmt-time').innerText = format.format(now);
        }
        setInterval(updateGmtTime, 1000);
        updateGmtTime();

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        animate();

        // Copy "kopf." to clipboard on click
        const copyEl = document.getElementById('discord-copy');
        copyEl.style.cursor = 'pointer';
        copyEl.addEventListener('click', () => {
            navigator.clipboard.writeText('kopf.').then(() => {
                const toast = document.getElementById('copy-toast');
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 2000);
            });
        });

        // osu! Cursor
        (function () {
            const cursor = document.createElement('div');
            cursor.id = 'osu-cursor';
            document.body.appendChild(cursor);

            document.addEventListener('mousemove', (e) => {
                cursor.style.left = e.clientX + 'px';
                cursor.style.top  = e.clientY + 'px';
            });
            document.addEventListener('mousedown',  () => cursor.classList.add('clicking'));
            document.addEventListener('mouseup',    () => cursor.classList.remove('clicking'));
            document.addEventListener('mouseleave', () => { cursor.style.opacity = '0'; });
            document.addEventListener('mouseenter', () => { cursor.style.opacity = '1'; });
        })();

        // Cursor Trail
        (function () {
            document.addEventListener('mousemove', (e) => {
                const dot = document.createElement('div');
                dot.className = 'cursor-trail-dot';
                dot.style.left = e.clientX + 'px';
                dot.style.top  = e.clientY + 'px';
                document.body.appendChild(dot);
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        dot.style.opacity = '0';
                        dot.style.transform = 'translate(-50%, -50%) scale(0.2)';
                        setTimeout(() => dot.remove(), 420);
                    }, 30);
                });
            });
        })();

        // Strip float-in classes after entrance so subsequent animations don't conflict
        document.querySelectorAll('.fi').forEach(el => {
            el.addEventListener('animationend', function handler(e) {
                if (e.animationName === 'staggerIn') {
                    el.removeEventListener('animationend', handler);
                    el.classList.forEach(c => { if (c === 'fi' || /^fi-\d+$/.test(c)) el.classList.remove(c); });
                    el.style.opacity = '1';
                }
            });
        });

        // Typing Effect
        (function () {
            const el = document.getElementById('archive-text');
            if (!el) return;
            const text = el.textContent.trim();
            el.textContent = '';
            let i = 0;
            setTimeout(() => {
                const t = setInterval(() => {
                    el.textContent += text[i++];
                    if (i >= text.length) clearInterval(t);
                }, 70);
            }, 600);
        })();

        // Glitch + Thunder Effect
        (function () {
            const el = document.getElementById('discord-copy');
            if (!el) return;
            setInterval(() => {
                const effect = Math.random() < 0.5 ? 'glitching' : 'thundering';
                el.classList.add(effect);
                setTimeout(() => el.classList.remove(effect), 750);
            }, 3500);
        })();

        // Lanyard — Discord Status + Spotify Now Playing
        (function () {
            const USER_ID  = '589696035803103233';
            const colorMap = { online: '#43b581', idle: '#faa61a', dnd: '#f04747', offline: '#747f8d' };
            const glowMap  = { online: '0 0 15px #43b581', idle: '0 0 15px #faa61a', dnd: '0 0 15px #f04747', offline: '0 0 15px #747f8d' };
            let heartbeat, progressInterval = null;

            function updateProgress(spotify) {
                const fill = document.getElementById('np-progress-fill');
                if (!fill || !spotify?.timestamps) return;
                const { start, end } = spotify.timestamps;
                fill.style.width = Math.min((Date.now() - start) / (end - start) * 100, 100) + '%';
            }

            function startProgress(spotify) {
                clearInterval(progressInterval);
                updateProgress(spotify);
                progressInterval = setInterval(() => updateProgress(spotify), 1000);
            }

            function stopProgress() {
                clearInterval(progressInterval);
                const fill = document.getElementById('np-progress-fill');
                if (fill) fill.style.width = '0%';
            }

            function updateUI(data) {
                const dot = document.querySelector('.discord-status');
                const s   = data.discord_status || 'offline';
                if (dot) {
                    dot.style.background = colorMap[s];
                    dot.style.boxShadow  = glowMap[s];
                }
                const spWidget = document.getElementById('spotify-widget');
                const miniText = document.getElementById('sp-mini-text');
                const artEl    = document.getElementById('np-art');
                const songEl   = document.getElementById('np-song');
                const artistEl = document.getElementById('np-artist');
                if (!spWidget) return;
                if (data.spotify) {
                    miniText.textContent = `${data.spotify.song} \u2014 ${data.spotify.artist}`;
                    artEl.src            = data.spotify.album_art_url;
                    songEl.textContent   = data.spotify.song;
                    songEl.href          = `https://open.spotify.com/track/${data.spotify.track_id}`;
                    artistEl.textContent = data.spotify.artist;
                    spWidget.classList.remove('not-listening');
                    spWidget.classList.add('visible');
                    startProgress(data.spotify);
                } else {
                    miniText.textContent = 'not listening';
                    spWidget.classList.remove('visible');
                    spWidget.classList.add('not-listening');
                    stopProgress();
                }
            }

            function connect() {
                const ws = new WebSocket('wss://api.lanyard.rest/socket');
                ws.onmessage = (e) => {
                    const msg = JSON.parse(e.data);
                    if (msg.op === 1) {
                        ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: USER_ID } }));
                        heartbeat = setInterval(() => {
                            if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ op: 3 }));
                        }, msg.d.heartbeat_interval);
                    }
                    if (msg.op === 0) updateUI(msg.d);
                };
                ws.onclose = () => { clearInterval(heartbeat); setTimeout(connect, 5000); };
            }

            connect();
        })();

        // Birthday Overlay — only on May 14 (GMT+8)
        (function () {
            if (!isBirthday) return;

            const overlay = document.getElementById('birthday-overlay');
            const canvas  = document.getElementById('confetti-canvas');
            const boom    = confetti.create(canvas, { resize: true, useWorker: true });

            function burst() {
                const colors = ['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#ff922b','#f72585'];
                const end = Date.now() + 4500;
                (function frame() {
                    boom({ particleCount: 4, angle: 60,  spread: 60, origin: { x: 0 }, colors });
                    boom({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1 }, colors });
                    if (Date.now() < end) requestAnimationFrame(frame);
                })();
            }

            burst();

            function dismiss() {
                overlay.classList.add('fade-out');
                setTimeout(() => { overlay.style.display = 'none'; startIntro(); }, 950);
            }

            overlay.addEventListener('click', dismiss);
            setTimeout(dismiss, 5500);
        })();

        // YouTube Videos View
        const YT_CHANNEL_ID = 'UC2p6RJT5si-CKxpf0JT0mdQ';
        let videosLoaded = false;

        function showVideos() {
            document.getElementById('home-view').classList.add('exiting');
            setTimeout(() => {
                document.getElementById('videos-view').classList.add('active');
                fetchYouTubeVideos();
            }, 80);
        }

        function showHome() {
            document.getElementById('videos-view').classList.remove('active');
            setTimeout(() => document.getElementById('home-view').classList.remove('exiting'), 250);
        }

        async function fetchYouTubeVideos() {
            if (videosLoaded) return;
            const container = document.getElementById('videos-container');
            container.innerHTML = '<p class="videos-loading">Loading . . .</p>';
            try {
                const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${YT_CHANNEL_ID}`;
                const res  = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(feedUrl)}`);
                const data = await res.json();
                if (!data.contents) throw new Error('no content');
                const xml     = new DOMParser().parseFromString(data.contents, 'text/xml');
                const entries = Array.from(xml.querySelectorAll('entry')).slice(0, 5);
                if (!entries.length) throw new Error('no entries');
                const items = entries.map(e => {
                    const rawId  = e.querySelector('id')?.textContent || '';
                    const vid    = rawId.split(':').pop();
                    return {
                        title:   e.querySelector('title')?.textContent || '',
                        link:    `https://www.youtube.com/watch?v=${vid}`,
                        pubDate: e.querySelector('published')?.textContent || '',
                        videoId: vid
                    };
                });
                renderVideos(items);
                videosLoaded = true;
            } catch {
                container.innerHTML = '<p class="videos-error">Could not load videos.</p>';
            }
        }

        function renderVideos(items) {
            const container = document.getElementById('videos-container');
            container.innerHTML = '';
            items.forEach((item, i) => {
                const thumb = `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`;
                const date  = new Date(item.pubDate).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric'
                });
                const card = document.createElement('a');
                card.href      = item.link;
                card.target    = '_blank';
                card.rel       = 'noopener noreferrer';
                card.className = 'video-card';
                card.style.animationDelay = `${i * 0.09 + 0.05}s`;
                card.innerHTML = `
                    <span class="video-card-num">${String(i + 1).padStart(2, '0')}</span>
                    <img class="video-thumb" src="${thumb}" alt="" loading="lazy">
                    <div class="video-info">
                        <h3 class="video-title">${item.title}</h3>
                        <span class="video-date">${date}</span>
                    </div>
                    <svg class="video-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                `;
                container.appendChild(card);
            });
        }
