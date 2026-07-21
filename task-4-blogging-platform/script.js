const STORAGE_KEY = 'dailybyte_data_v2';

function seedData(){
  return {
    posts: [
      {
        id: 'p1', title: 'Why Server-Side Rendering Is Making a Comeback',
        author: 'Maya Chen', category: 'Opinion', tags:['react','ssr','performance'],
        date: '2026-07-14',
        cover: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=900&q=80',
        content: '<p>For a few years, the pendulum swung hard toward fully client-rendered single page apps. Now it is swinging back — and for good reason.</p><h2>The problem with client-only rendering</h2><p>Shipping a blank HTML shell and letting JavaScript do all the work sounds elegant until you measure real-world load times on a mid-range phone over a spotty connection.</p><p>Frameworks like Next.js and Remix made server rendering painless again, blending the interactivity of SPAs with the speed of traditional server rendering.</p>',
        comments: [
          {name:'DevDan', text:'Totally agree, hydration issues aside SSR feels so much snappier.', date:'2026-07-15'},
          {name:'CeeJay', text:'Curious how this plays with edge functions.', date:'2026-07-15'}
        ]
      },
      {
        id: 'p2', title: 'A Practical Guide to CSS Grid in 2026',
        author: 'Sam Osei', category: 'Tutorial', tags:['css','grid','layout'],
        date: '2026-07-10',
        cover: 'https://images.unsplash.com/photo-1621839673705-6617adf9e890?w=900&q=80',
        content: '<p>CSS Grid quietly became the most powerful layout tool in the browser. Here is a hands-on walkthrough of the patterns you will actually use.</p><h2>Start with the container</h2><p>Define your tracks with <code>grid-template-columns</code> and let content dictate the rest using <code>minmax()</code> and <code>auto-fill</code>.</p>',
        comments: [
          {name:'Priya', text:'The auto-fill vs auto-fit explanation finally made it click for me!', date:'2026-07-11'}
        ]
      },
      {
        id: 'p3', title: 'Landing Your First Junior Dev Role Without a CS Degree',
        author: 'Marcus Lee', category: 'Career', tags:['career','portfolio'],
        date: '2026-07-05',
        cover: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=900&q=80',
        content: '<p>Self-taught developers land jobs every day. The path is different, not impossible.</p><h2>Build in public</h2><p>A messy but real project beats a tutorial clone every time in an interview conversation.</p>',
        comments: []
      },
      {
        id: 'p4', title: 'Designing Interfaces People Actually Trust',
        author: 'Elena Ruiz', category: 'Design', tags:['ux','design','trust'],
        date: '2026-06-29',
        cover: 'https://images.unsplash.com/photo-1559028012-481c04fa702d?w=900&q=80',
        content: '<p>Trust is a design material, not an afterthought. Small consistency cues compound into confidence.</p><h2>Say exactly what will happen</h2><p>A button labeled "Delete" should delete, immediately, with an undo — not open a maze of confirmation dialogs.</p>',
        comments: [
          {name:'RiaK', text:'The point about consistent vocabulary across the UI is so underrated.', date:'2026-06-30'}
        ]
      },
      {
        id: 'p5', title: 'JavaScript Fetch API: A Beginner-Friendly Walkthrough',
        author: 'Noah Kim', category: 'Tutorial', tags:['javascript','fetch','api'],
        date: '2026-06-20',
        cover: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=900&q=80',
        content: '<p>The Fetch API is the modern, promise-based way to talk to a server from the browser — no extra libraries needed.</p><h2>A basic GET request</h2><p>Call <code>fetch(url)</code>, wait for the response, then turn it into JSON with <code>.json()</code>. Wrap it in a <code>try/catch</code> so a bad connection does not crash your app.</p><p>Once you are comfortable with GET requests, POST requests work the same way — just add a method and a body to the options object.</p>',
        comments: [
          {name:'TinaW', text:'Clear explanation, finally understand async/await with fetch.', date:'2026-06-21'}
        ]
      },
      {
        id: 'p6', title: 'Remote Work Habits That Actually Boost Focus',
        author: 'Aisha Bello', category: 'News', tags:['remote-work','productivity'],
        date: '2026-06-15',
        cover: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=900&q=80',
        content: '<p>Working from home sounds distraction-free until the laundry starts calling your name. A few small habits make a bigger difference than any productivity app.</p><h2>Protect your first hour</h2><p>Before opening Slack or email, spend the first hour of the day on the one task that matters most. Everything else can wait thirty minutes.</p>',
        comments: []
      }
    ]
  };
}

function loadData(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw){ try{ return JSON.parse(raw); }catch(e){ /* fall through */ } }
  const seeded = seedData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}
function saveData(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(DATA)); }

let DATA = loadData();
let activeCategory = 'All';
let searchTerm = '';
let currentPostId = null;
let editingPostId = null;
let pendingCoverDataUrl = null;

function typeTitle(){
  const el = document.getElementById('siteTitle');
  const text = 'The Daily Byte';
  let i = 0;
  el.innerHTML = '';
  const span = document.createElement('span');
  el.appendChild(span);
  const cursor = document.createElement('span');
  cursor.className='cursor';
  cursor.innerHTML='&nbsp;';
  el.appendChild(cursor);
  const timer = setInterval(()=>{
    span.textContent = text.slice(0,++i);
    if(i>=text.length) clearInterval(timer);
  },70);
}

function initMasthead(){
  document.getElementById('todayDate').textContent = new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  document.getElementById('year').textContent = new Date().getFullYear();
  typeTitle();
}

function renderChips(){
  const cats = ['All', ...new Set(DATA.posts.map(p=>p.category))];
  const wrap = document.getElementById('categoryChips');
  wrap.innerHTML = '';
  cats.forEach(c=>{
    const b = document.createElement('button');
    b.className = 'chip' + (c===activeCategory ? ' active':'');
    b.textContent = c;
    b.onclick = ()=>{ activeCategory = c; renderChips(); renderFeed(); };
    wrap.appendChild(b);
  });
}

function timeAgo(dateStr){
  return new Date(dateStr).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
}

function renderFeed(){
  const feed = document.getElementById('feed');
  let posts = [...DATA.posts].sort((a,b)=> new Date(b.date)-new Date(a.date));
  if(activeCategory !== 'All') posts = posts.filter(p=>p.category===activeCategory);
  if(searchTerm.trim()){
    const t = searchTerm.toLowerCase();
    posts = posts.filter(p=>
      p.title.toLowerCase().includes(t) ||
      p.content.toLowerCase().includes(t) ||
      p.tags.join(' ').toLowerCase().includes(t)
    );
  }
  document.getElementById('postCount').textContent = posts.length + ' STORIES';

  if(posts.length===0){
    feed.innerHTML = '<div class="empty-state">No stories found. Try a different search or category.</div>';
    return;
  }

  feed.innerHTML = posts.map(p=>`
    <article class="card" onclick="openPost('${p.id}')">
      <div class="stamp">${p.category}</div>
      ${p.cover ? `<img src="${p.cover}" alt="">` : ''}
      <div class="card-body">
        <h3>${escapeHtml(p.title)}</h3>
        <p class="excerpt">${stripHtml(p.content).slice(0,110)}...</p>
      </div>
      <div class="byline"><span>by ${escapeHtml(p.author)}</span><span>${timeAgo(p.date)}</span></div>
      <div class="tag-row">${p.tags.map(t=>`<span class="tag-pill">#${escapeHtml(t)}</span>`).join('')}</div>
    </article>
  `).join('');
}

function stripHtml(html){
  const d = document.createElement('div');
  d.innerHTML = html;
  return d.textContent || '';
}
function escapeHtml(str){
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}
function openPost(id){
  currentPostId = id;
  const p = DATA.posts.find(x=>x.id===id);
  if(!p) return;
  const view = document.getElementById('postView');
  view.innerHTML = `
    <button class="close-btn" onclick="closePost()">✕</button>
    ${p.cover ? `<img class="cover" src="${p.cover}" alt="">` : ''}
    <div class="pv-body">
      <div class="stamp" style="position:static;display:inline-block;">${p.category}</div>
      <h2>${escapeHtml(p.title)}</h2>
      <div class="byline"><span>by ${escapeHtml(p.author)}</span><span>${timeAgo(p.date)}</span></div>
      <div class="post-content">${p.content}</div>
      <div class="tag-row" style="padding-left:0;">${p.tags.map(t=>`<span class="tag-pill">#${escapeHtml(t)}</span>`).join('')}</div>

      <div class="comments-section">
        <h4>${p.comments.length} Comment${p.comments.length!==1?'s':''}</h4>
        <div id="commentsList">
          ${p.comments.map(c=>`
            <div class="comment">
              <div class="c-head"><span class="c-name">${escapeHtml(c.name)}</span><span>${timeAgo(c.date)}</span></div>
              <div>${escapeHtml(c.text)}</div>
            </div>
          `).join('') || '<p style="color:#8a8570;font-size:.85rem;">Be the first to comment.</p>'}
        </div>
        <div class="comment-form">
          <input type="text" id="commentName" placeholder="Your name">
          <textarea id="commentText" placeholder="Share your thoughts..."></textarea>
          <button class="btn" onclick="submitComment()">Post Comment</button>
        </div>
      </div>
    </div>
  `;
  document.getElementById('postOverlay').classList.add('show');
}
function closePost(){
  document.getElementById('postOverlay').classList.remove('show');
  currentPostId = null;
}
function submitComment(){
  const name = document.getElementById('commentName').value.trim();
  const text = document.getElementById('commentText').value.trim();
  if(!name || !text){ alert('Please fill in your name and comment.'); return; }
  const p = DATA.posts.find(x=>x.id===currentPostId);
  p.comments.push({name, text, date: new Date().toISOString().slice(0,10)});
  saveData();
  openPost(currentPostId);
  renderFeed();
}

document.getElementById('searchInput').addEventListener('input', e=>{
  searchTerm = e.target.value;
  renderFeed();
});

const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

function openLogin(){
  document.getElementById('adminLoginOverlay').classList.add('show');
  document.getElementById('loginError').textContent = '';
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
}
function closeLogin(){ document.getElementById('adminLoginOverlay').classList.remove('show'); }

function attemptLogin(){
  const u = document.getElementById('loginUser').value.trim();
  const pw = document.getElementById('loginPass').value;
  if(u===ADMIN_USER && pw===ADMIN_PASS){
    closeLogin();
    openAdmin();
  } else {
    document.getElementById('loginError').textContent = 'Invalid username or password.';
  }
}
function logoutAdmin(){
  document.getElementById('adminOverlay').classList.remove('show');
}
function openAdmin(){
  document.getElementById('adminOverlay').classList.add('show');
  switchAdminTab('posts');
  renderAdminPosts();
  renderAdminComments();
  renderAdminReaders();
  resetEditor();
}

function switchAdminTab(tab){
  document.querySelectorAll('.admin-tab').forEach(b=>b.classList.toggle('active', b.dataset.tab===tab));
  document.querySelectorAll('.admin-section').forEach(s=>s.classList.toggle('active', s.id==='tab-'+tab));
}

function fmt(cmd, val){
  document.getElementById('pContent').focus();
  document.execCommand(cmd, false, val || null);
}
function insertLink(){
  const url = prompt('Enter URL:', 'https://');
  if(url) fmt('createLink', url);
}
document.getElementById('inlineImgFile').addEventListener('change', function(e){
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ev=>{
    document.getElementById('pContent').focus();
    document.execCommand('insertImage', false, ev.target.result);
  };
  reader.readAsDataURL(file);
  e.target.value = '';
});
document.getElementById('pCoverFile').addEventListener('change', function(e){
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ev=>{
    pendingCoverDataUrl = ev.target.result;
    const prev = document.getElementById('pCoverPreview');
    prev.src = ev.target.result;
    prev.style.display = 'block';
  };
  reader.readAsDataURL(file);
});

function resetEditor(){
  editingPostId = null;
  pendingCoverDataUrl = null;
  document.getElementById('editorFormTitle').textContent = ' New Post';
  document.getElementById('pTitle').value = '';
  document.getElementById('pAuthor').value = '';
  document.getElementById('pCategory').value = 'Tutorial';
  document.getElementById('pTags').value = '';
  document.getElementById('pContent').innerHTML = '';
  document.getElementById('pCoverPreview').style.display = 'none';
  document.getElementById('pCoverPreview').src = '';
  document.getElementById('pCoverFile').value = '';
}

function savePost(){
  const title = document.getElementById('pTitle').value.trim();
  const author = document.getElementById('pAuthor').value.trim() || 'Staff Writer';
  const category = document.getElementById('pCategory').value;
  const tags = document.getElementById('pTags').value.split(',').map(t=>t.trim()).filter(Boolean);
  const content = document.getElementById('pContent').innerHTML.trim();

  if(!title || !content){ alert('Please add a title and some content before publishing.'); return; }

  if(editingPostId){
    const p = DATA.posts.find(x=>x.id===editingPostId);
    p.title = title; p.author = author; p.category = category; p.tags = tags; p.content = content;
    if(pendingCoverDataUrl) p.cover = pendingCoverDataUrl;
  } else {
    DATA.posts.unshift({
      id: 'p' + Date.now(),
      title, author, category, tags, content,
      cover: pendingCoverDataUrl || '',
      date: new Date().toISOString().slice(0,10),
      comments: []
    });
  }
  saveData();
  resetEditor();
  renderAdminPosts();
  renderChips();
  renderFeed();
  alert('Saved! Your story is live on the front page.');
}

function editPost(id){
  const p = DATA.posts.find(x=>x.id===id);
  if(!p) return;
  editingPostId = id;
  pendingCoverDataUrl = p.cover || null;
  document.getElementById('editorFormTitle').textContent = ' Editing: ' + p.title;
  document.getElementById('pTitle').value = p.title;
  document.getElementById('pAuthor').value = p.author;
  document.getElementById('pCategory').value = p.category;
  document.getElementById('pTags').value = p.tags.join(', ');
  document.getElementById('pContent').innerHTML = p.content;
  const prev = document.getElementById('pCoverPreview');
  if(p.cover){ prev.src = p.cover; prev.style.display='block'; } else { prev.style.display='none'; }
  window.scrollTo(0,0);
  document.querySelector('.admin-body').scrollTop = 0;
}

function deletePost(id){
  if(!confirm('Delete this post and all its comments? This cannot be undone.')) return;
  DATA.posts = DATA.posts.filter(x=>x.id!==id);
  saveData();
  renderAdminPosts();
  renderAdminComments();
  renderAdminReaders();
  renderChips();
  renderFeed();
}

function renderAdminPosts(){
  const tbody = document.getElementById('adminPostsTable');
  tbody.innerHTML = DATA.posts.map(p=>`
    <tr>
      <td>${escapeHtml(p.title)}</td>
      <td><span class="badge">${p.category}</span></td>
      <td>${timeAgo(p.date)}</td>
      <td>${p.comments.length}</td>
      <td class="row-actions">
        <button class="btn small ghost" onclick="editPost('${p.id}')">Edit</button>
        <button class="btn small danger" onclick="deletePost('${p.id}')">Delete</button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="5">No posts yet.</td></tr>';
}

function renderAdminComments(){
  const tbody = document.getElementById('adminCommentsTable');
  let rows = [];
  DATA.posts.forEach(p=>{
    p.comments.forEach((c, idx)=>{
      rows.push({postId:p.id, postTitle:p.title, idx, ...c});
    });
  });
  rows.sort((a,b)=> new Date(b.date)-new Date(a.date));
  tbody.innerHTML = rows.map(r=>`
    <tr>
      <td>${escapeHtml(r.postTitle)}</td>
      <td>${escapeHtml(r.name)}</td>
      <td>${escapeHtml(r.text)}</td>
      <td>${timeAgo(r.date)}</td>
      <td><button class="btn small danger" onclick="deleteComment('${r.postId}', ${r.idx})">Delete</button></td>
    </tr>
  `).join('') || '<tr><td colspan="5">No comments yet.</td></tr>';
}
function deleteComment(postId, idx){
  if(!confirm('Delete this comment?')) return;
  const p = DATA.posts.find(x=>x.id===postId);
  p.comments.splice(idx,1);
  saveData();
  renderAdminComments();
  renderAdminReaders();
  renderAdminPosts();
}

function renderAdminReaders(){
  const tbody = document.getElementById('adminReadersTable');
  const map = {};
  DATA.posts.forEach(p=>{
    p.comments.forEach(c=>{
      if(!map[c.name]) map[c.name] = {count:0, last:c.date};
      map[c.name].count++;
      if(new Date(c.date) > new Date(map[c.name].last)) map[c.name].last = c.date;
    });
  });
  const names = Object.keys(map);
  tbody.innerHTML = names.map(n=>`
    <tr>
      <td>${escapeHtml(n)}</td>
      <td>${map[n].count}</td>
      <td>${timeAgo(map[n].last)}</td>
      <td><button class="btn small danger" onclick="deleteReader('${n.replace(/'/g,"\\'")}')">Remove all comments</button></td>
    </tr>
  `).join('') || '<tr><td colspan="4">No readers have commented yet.</td></tr>';
}
function deleteReader(name){
  if(!confirm(`Remove all comments by "${name}"?`)) return;
  DATA.posts.forEach(p=>{ p.comments = p.comments.filter(c=>c.name!==name); });
  saveData();
  renderAdminComments();
  renderAdminReaders();
  renderAdminPosts();
}

initMasthead();
renderChips();
renderFeed();

document.addEventListener('keydown', e=>{
  if(e.key==='Escape'){
    closePost();
    closeLogin();
  }
});

document.getElementById('postOverlay').addEventListener('click', e=>{
  if(e.target.id==='postOverlay') closePost();
});