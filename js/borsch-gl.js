/* ============ Реалистичный бульон борща (WebGL) ============
   Рисует поверхность: переливы бульона, овощи на разной глубине,
   жиринки, разводы сметаны, блики и круги по воде. */
(function () {
  const cvs = document.querySelector('canvas.broth');
  if (!cvs) return;
  const gl = cvs.getContext('webgl', { premultipliedAlpha: true, antialias: false, alpha: true });
  if (!gl) { cvs.remove(); return; }
  document.documentElement.classList.add('has-gl');

  const VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  const FS = `
precision highp float;
uniform vec2 uRes; uniform float uT; uniform vec2 uL; uniform vec4 uC[6];
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float h12(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
vec2 h22(vec2 p){vec3 p3=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973));p3+=dot(p3,p3.yzx+33.33);return fract((p3.xx+p3.yz)*p3.zy);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
  return mix(mix(h12(i),h12(i+vec2(1,0)),u.x),mix(h12(i+vec2(0,1)),h12(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float s=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<5;i++){s+=a*vn(p);p=m*p;a*=.5;}return s;}
float fbm3(vec2 p){float s=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<3;i++){s+=a*vn(p);p=m*p;a*=.5;}return s;}
float swirlA(float r){return uT*.035+sin(uT*.13)*.35*(1.-r)+sin(uT*.07+1.)*.2*r*r;}
float height(vec2 q){
  float r=length(q);
  vec2 p=rot(swirlA(r))*q;
  vec2 w=p*2.6+vec2(uT*.04,-uT*.03);
  float h=fbm3(w+fbm3(w*.8-uT*.025)*1.4)*.5;
  for(int i=0;i<6;i++){
    vec4 c=uC[i]; float age=uT-c.z;
    if(age>0.&&age<5.){
      float d=length(q-c.xy);
      float env=exp(-pow((d-age*.3)*5.5,2.))*exp(-age*.85)*c.w;
      h+=sin(d*48.-age*13.)*env*.12;
    }
  }
  return h;
}
float sdRB(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}
vec4 layer(vec2 q,float sc,float seed,float px){
  vec2 g=q*sc; vec2 id=floor(g); vec2 f=fract(g); vec4 acc=vec4(0.);
  for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){
    vec2 o=vec2(float(i),float(j)); vec2 cid=id+o;
    float h1=h12(cid+seed),h2=h12(cid+seed*1.7+11.),h3=h12(cid+seed*2.3+23.),h4=h12(cid+seed*3.1+37.);
    if(h1>.93) continue;
    vec2 c=o+.5+(h22(cid+seed)-.5)*.7;
    vec2 l=rot(h2*6.2832)*(f-c);
    vec3 col; vec2 b; float cr; float al=1.; float gloss=0.;
    if(h3<.46){ l.y+=l.x*l.x*(h4-.5)*1.4; b=vec2(.34+.22*h4,.05+.025*h1); cr=b.y; col=mix(vec3(.22,.012,.06),vec3(.45,.035,.14),h4); gloss=1.; }
    else if(h3<.62){ l.y+=l.x*l.x*(h4-.5)*.8; b=vec2(.22+.12*h4,.045); cr=.045; col=mix(vec3(.84,.34,.07),vec3(.96,.5,.14),h4); gloss=.7; }
    else if(h3<.8){ l.y+=l.x*l.x*(h4-.5)*2.2; b=vec2(.36+.2*h4,.026); cr=.026; col=vec3(.94,.8,.62); al=.5; }
    else if(h3<.92){ b=vec2(.15+.06*h4,.11+.04*h1); cr=.07; col=vec3(.33,.14,.075)*(.65+.55*vn(l*vec2(34.,6.)+cid*7.)); }
    else { b=vec2(.1,.095); cr=.03; col=vec3(.86,.68,.42); al=.88; }
    float d=sdRB(l,b,cr);
    float cov=1.-smoothstep(-px,px,d);
    if(cov<=0.) continue;
    float inner=clamp(-d/min(b.x,b.y),0.,1.);
    col*=.5+.62*sqrt(inner);
    col+=vec3(.5,.35,.35)*smoothstep(.6,1.,inner)*.22*gloss;
    float a=cov*al;
    acc.rgb=acc.rgb*(1.-a)+col*a; acc.a=acc.a*(1.-a)+a;
  }
  return acc;
}
vec4 fat(vec2 q,float sc,float seed,float px,float r0,float r1,float dens){
  vec2 g=q*sc; vec2 id=floor(g),f=fract(g); vec4 acc=vec4(0.);
  for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){
    vec2 o=vec2(float(i),float(j)); vec2 cid=id+o;
    if(h12(cid+seed)>dens) continue;
    vec2 c=o+.5+(h22(cid+seed*1.3)-.5)*.6;
    float rr=mix(r0,r1,pow(h12(cid+seed+5.),2.));
    vec2 dv=f-c; float d=length(dv)-rr;
    float cov=1.-smoothstep(-px,px,d);
    if(cov<=0.) continue;
    float ring=smoothstep(px*4.,0.,abs(d+px*2.))*.45;
    float spot=smoothstep(.22,0.,length(dv/rr-vec2(-.4,.4)));
    vec3 col=vec3(.75,.32,.06); float a=cov*.3;
    col=mix(col,vec3(1.,.72,.42),ring); a=max(a,ring*cov*.6);
    col=mix(col,vec3(1.),spot*.95); a=max(a,spot*cov*.95);
    acc.rgb=acc.rgb*(1.-a)+col*a; acc.a=acc.a*(1.-a)+a;
  }
  return acc;
}
void main(){
  vec2 uv=(gl_FragCoord.xy/uRes)*2.-1.;
  float r=length(uv);
  float px=2./uRes.x;
  float mask=1.-smoothstep(1.-px*1.5,1.,r);
  if(mask<=0.){gl_FragColor=vec4(0.);return;}
  vec2 p=rot(swirlA(r))*uv;
  // бульон
  float n=fbm(p*1.8+3.1);
  float n2=fbm(p*3.4-uT*.02+8.);
  vec3 col=mix(vec3(.28,.01,.03),vec3(.66,.05,.08),smoothstep(.28,.78,n));
  col=mix(col,vec3(.86,.26,.08),smoothstep(.55,.9,n2)*.5);
  vec3 broth=col;
  // овощи и мясо: три глубины
  vec4 L=layer(rot(.3)*p,2.7,1.,px*2.7*1.3);
  L.rgb=mix(L.rgb,L.rgb*vec3(.9,.4,.4)+broth*L.a*.3,.5); L*=.85;
  col=col*(1.-L.a)+L.rgb;
  L=layer(rot(1.7)*p,3.4,2.,px*3.4*1.3);
  L.rgb=mix(L.rgb,L.rgb*vec3(.95,.5,.5)+broth*L.a*.25,.3); L*=.92;
  col=col*(1.-L.a)+L.rgb;
  L=layer(rot(3.1)*p,4.2,3.,px*4.2*1.3);
  col=col*(1.-L.a)+L.rgb;
  // сметана растекается
  float ang=atan(p.y,p.x);
  float st=fbm(vec2(ang*2.5,r*6.-uT*.05));
  float halo=smoothstep(.58,.37,r)*smoothstep(.42,.8,st);
  col=mix(col,vec3(.88,.52,.52),halo*.6);
  // жир
  vec2 pf=rot(swirlA(r)*.45)*uv;
  vec4 F=fat(pf,5.,4.,px*5.*1.2,.08,.3,.3); col=col*(1.-F.a)+F.rgb;
  F=fat(pf+1.3,13.,5.,px*13.*1.2,.08,.26,.3); col=col*(1.-F.a*.8)+F.rgb*.8;
  // свет
  float e=3./uRes.x;
  float h0=height(uv),hx=height(uv+vec2(e,0.)),hy=height(uv+vec2(0.,e));
  vec3 N=normalize(vec3((h0-hx)/e*.08,(h0-hy)/e*.08,1.));
  vec3 Ld=normalize(vec3(uL,1.));
  col*=.78+.38*dot(N,Ld);
  vec3 H=normalize(Ld+vec3(0.,0.,1.));
  float nh=max(dot(N,H),0.);
  float sp=pow(nh,200.)*1.3+pow(nh,28.)*.07;
  vec3 R=reflect(vec3(0.,0.,-1.),N);
  vec2 wp=uv+R.xy*.7-uL*.5;
  float win=smoothstep(.16,.03,length(wp*vec2(1.,1.5)))*.32;
  col+=vec3(1.,.94,.9)*(sp+win);
  // стенки тарелки
  vec2 dir=uv/max(r,1e-3);
  float facing=dot(dir,normalize(uL));
  col*=1.-smoothstep(.76,1.,r)*clamp(facing,0.,1.)*.6;
  col*=1.-smoothstep(.72,1.,r)*.22;
  float men=smoothstep(.94,.985,r)*(1.-smoothstep(.985,1.,r));
  col+=vec3(1.,.6,.5)*men*.3*(.35+.65*clamp(-facing,0.,1.));
  gl_FragColor=vec4(col*mask,mask);
}`;

  const sh = (type, src) => {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
    return s;
  };
  const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) { cvs.remove(); document.documentElement.classList.remove('has-gl'); return; }
  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aLoc = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(aLoc);
  gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);
  const U = {
    res: gl.getUniformLocation(prog, 'uRes'), t: gl.getUniformLocation(prog, 'uT'),
    l: gl.getUniformLocation(prog, 'uL'), c: gl.getUniformLocation(prog, 'uC'),
  };

  const resize = () => {
    const s = Math.min(window.devicePixelRatio || 1, innerWidth < 700 ? 1.25 : 1.6);
    const w = Math.max(64, Math.round(cvs.clientWidth * s));
    if (cvs.width !== w) { cvs.width = w; cvs.height = w; }
    gl.viewport(0, 0, cvs.width, cvs.height);
  };
  resize();
  window.addEventListener('resize', resize);

  const start = performance.now();
  const now = () => (performance.now() - start) / 1000;
  const clicks = new Float32Array(24).fill(0);
  for (let i = 0; i < 6; i++) clicks[i * 4 + 2] = -99;
  let ci = 0;
  const ripple = (x, y, amp) => {
    clicks.set([x, y, now(), amp], ci * 4); ci = (ci + 1) % 6;
  };
  window.borschRipple = ripple;

  // клик/тап по тарелке
  const visual = cvs.closest('.hero__visual');
  visual.addEventListener('pointerdown', (e) => {
    const r = cvs.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 2 - 1;
    const y = -(((e.clientY - r.top) / r.height) * 2 - 1);
    if (x * x + y * y < 1) ripple(x, y, 1.2);
  });
  // бульон тихо «дышит»
  setInterval(() => {
    if (document.hidden) return;
    const a = Math.random() * Math.PI * 2, d = .45 + Math.random() * .45;
    ripple(Math.cos(a) * d, Math.sin(a) * d, .35);
  }, 2600);
  // сметана шлёпается — круги от центра
  document.addEventListener('bb:loaded', () => setTimeout(() => ripple(0, 0, 2), 2000));

  // свет следует за курсором
  let lx = -.6, ly = .65, tx = lx, ty = ly;
  window.addEventListener('mousemove', (e) => {
    tx = -.6 + (e.clientX / innerWidth - .5) * 1.1;
    ty = .65 - (e.clientY / innerHeight - .5) * 1.1;
  });

  let visible = true;
  new IntersectionObserver((en) => { visible = en[0].isIntersecting; }).observe(cvs);

  (function frame() {
    if (visible && !document.hidden) {
      lx += (tx - lx) * .05; ly += (ty - ly) * .05;
      gl.uniform2f(U.res, cvs.width, cvs.height);
      gl.uniform1f(U.t, now());
      gl.uniform2f(U.l, lx, ly);
      gl.uniform4fv(U.c, clicks);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    requestAnimationFrame(frame);
  })();
})();
