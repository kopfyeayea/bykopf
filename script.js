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

        document.addEventListener('mousemove', (e) => {
            mouseX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
            mouseY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
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
