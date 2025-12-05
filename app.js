(() => {
  const qs = s => document.querySelector(s);
  const qsa = s => Array.from(document.querySelectorAll(s));

  // nav y páginas
  const navBtns = qsa('.nav-btn');
  const pages = qsa('.page');

  // elementos
  const teamsTableBody = qs('#teamsTableBody');
  const podiumEl = qs('#podium');
  const teamsTop3 = qs('#teamsTop3');
  const rankingBody = qs('#rankingBody');
  const searchAll = qs('#searchAll');
  const bestMale = qs('#bestMale');
  const bestFemale = qs('#bestFemale');
  const bestSub15 = qs('#bestSub15');
  const campInfoEl = qs('#campInfo');
  const saveInfoBtn = qs('#saveInfo');
  const pinInput = qs('#pinInput');
  const pinBtn = qs('#pinBtn');
  const pinArea = qs('#pinArea');
  const adminArea = qs('#adminArea');
  const formTeam = qs('#formTeam');
  const teamName = qs('#teamName');
  const teamsAdminList = qs('#teamsAdminList');
  const formMember = qs('#formMember');
  const memberName = qs('#memberName');
  const memberAge = qs('#memberAge');
  const memberTeamSelect = qs('#memberTeamSelect');
  const memberGender = qs('#memberGender');
  const memberPhoto = qs('#memberPhoto');
  const adminSearch = qs('#adminSearch');
  const adminResults = qs('#adminResults');
  const modal = qs('#modal');
  const closeModal = qs('#closeModal');
  const editForm = qs('#editForm');
  const editId = qs('#editId');
  const editName = qs('#editName');
  const editAge = qs('#editAge');
  const editGender = qs('#editGender');
  const editTeam = qs('#editTeam');
  const editPhoto = qs('#editPhoto');
  const deleteBtn = qs('#deleteBtn');

  // Supabase
  const supabaseUrl = 'TU_SUPABASE_URL';
  const supabaseKey = 'TU_SUPABASE_ANON_KEY';
  const supabase = supabase.createClient(supabaseUrl, supabaseKey);

  // data
  let data = { teams: [], info: '' };
  const PIN = '19202122';

  function id(){ return '_' + Math.random().toString(36).slice(2,9); }

  async function fileToBase64(file){
    if(!file) return null;
    return await new Promise(res=>{
      const reader = new FileReader();
      reader.onload = () => res(reader.result);
      reader.readAsDataURL(file);
    });
  }

  // ---------------- Supabase CRUD ----------------
  async function loadData(){
    const { data: teamsData, error: tErr } = await supabase.from('teams').select('*');
    if(tErr) return console.error(tErr);
    const { data: membersData, error: mErr } = await supabase.from('members').select('*');
    if(mErr) return console.error(mErr);

    data.teams = teamsData.map(t => ({
      id: t.id,
      name: t.name,
      members: membersData.filter(m => m.team_id === t.id)
    }));
    renderAll();
  }

  async function saveTeam(team){ await supabase.from('teams').upsert([{ id: team.id, name: team.name }]); }
  async function saveMember(member){ await supabase.from('members').upsert([member]); }
  async function deleteMemberDB(memberId){ await supabase.from('members').delete().eq('id', memberId); }

  // ---------------- NAV ----------------
  function showSection(id){
    pages.forEach(p=>p.classList.add('hidden'));
    const target = qs('#'+id);
    if(target) target.classList.remove('hidden');
    navBtns.forEach(b=>b.classList.toggle('active', b.dataset.section===id));
  }
  navBtns.forEach(b=>b.addEventListener('click', ()=>showSection(b.dataset.section)));

  // ---------------- RENDER ----------------
  function teamScore(team){ return team.members.reduce((s,m)=> s + (Number(m.points)||0),0); }

  function renderTeamsTable(){
    teamsTableBody.innerHTML = '';
    data.teams.forEach(t=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${t.name}</td><td>${teamScore(t)} pts</td>`;
      teamsTableBody.appendChild(tr);
    });
  }

  function renderPodium(){
    const sorted = [...data.teams].sort((a,b)=> teamScore(b)-teamScore(a));
    const places = ['gold','silver','bronze'];
    podiumEl.innerHTML = '';
    for(let i=0;i<3;i++){
      const t = sorted[i]; if(!t) continue;
      const div = document.createElement('div');
      div.className = 'place '+places[i];
      div.innerHTML = `<div class="avatar">${t.name}</div>
                       <div style="margin-top:8px;font-weight:800">${t.name}</div>
                       <div style="color:var(--muted)">${teamScore(t)} pts</div>`;
      podiumEl.appendChild(div);
    }
  }

  function renderTeamsTop3(){
    teamsTop3.innerHTML = '';
    data.teams.forEach(team=>{
      const card = document.createElement('div'); card.className='team-card';
      const top = [...team.members].sort((a,b)=> (b.points||0)-(a.points||0)).slice(0,3);
      let inner = `<div style="flex:1"><div style="font-weight:800">${team.name}</div>`;
      const roles = ['Mayordomo','Siervo inicial','Aprendiz'];
      const colors = ['var(--accent)','#d4af37','#c0c0c0'];
      top.forEach((m,idx)=>{
        const role = roles[idx]||'Aprendiz';
        const color = colors[idx]||'#c0c0c0';
        inner+=`<div style="display:flex;align-items:center;gap:10px;margin-top:8px">
                  <img src="${m.photo||'images/default.jpg'}" width="56" height="56" style="object-fit:cover;border-radius:8px"/>
                  <div><div style="font-weight:700;color:${color}">${m.name}</div>
                  <small style="color:var(--muted)">${role}</small>
                  <div style="font-weight:700">${m.points||0} pts</div></div>
                </div>`;
      });
      inner+='</div>'; card.innerHTML=inner; teamsTop3.appendChild(card);
    });
  }

  function renderRanking(filter=''){
    const all = data.teams.flatMap(t=>t.members.map(m=>({...m,team:t.name})));
    const sorted = all.sort((a,b)=> (b.points||0)-(a.points||0));
    const rows = sorted.filter(x=> x.name.toLowerCase().includes(filter.toLowerCase()));
    rankingBody.innerHTML='';
    rows.forEach((m,idx)=>{
      const opacity = Math.max(1-idx*0.015,0.5);
      const tr = document.createElement('tr');
      tr.innerHTML=`<td>${idx+1}</td>
                    <td style="font-weight:700;color:rgba(255,255,255,${opacity})">${m.name}</td>
                    <td style="color:var(--muted)">${m.team}</td>
                    <td style="font-weight:800">${m.points||0}</td>`;
      rankingBody.appendChild(tr);
    });
  }

  function renderMejores(){
    const all = data.teams.flatMap(t=>t.members.map(m=>({...m,team:t.name})));
    function topByFilter(arr, key){ return arr.filter(key).sort((a,b)=>(b.points||0)-(a.points||0)).slice(0,3); }
    const males = topByFilter(all, x=>x.gender==='m');
    const females = topByFilter(all, x=>x.gender==='f');
    const sub15 = topByFilter(all, x=> Number(x.age)<15);

    function renderList(container, arr){
      container.innerHTML='';
      if(!arr.length){ container.innerHTML='<div style="color:var(--muted)">Sin datos</div>'; return; }
      arr.forEach(m=>{
        const d=document.createElement('div'); d.style.marginTop='8px';
        d.innerHTML=`<div style="display:flex;gap:10px;align-items:center">
                        <img src="${m.photo||'images/default.jpg'}" width="64" height="64" style="object-fit:cover;border-radius:8px"/>
                        <div>
                          <div style="font-weight:800">${m.name}</div>
                          <small style="color:var(--muted)">${m.team} • ${m.age||'-'} años</small>
                          <div style="font-weight:800;margin-top:6px">${m.points||0} pts</div>
                        </div>
                     </div>`;
        container.appendChild(d);
      });
    }
    renderList(bestMale,males);
    renderList(bestFemale,females);
    renderList(bestSub15,sub15);
  }

  // ---------------- INFO ----------------
  saveInfoBtn.addEventListener('click', async ()=>{
    data.info=campInfoEl.value||'';
    await supabase.from('teams').update({info:data.info}); // opcional, si guardas info en tabla aparte
    alert('Información guardada.');
  });

  // ---------------- ADMIN PIN ----------------
  pinBtn.addEventListener('click', ()=>{
    if(pinInput.value===PIN){
      pinArea.classList.add('hidden'); adminArea.classList.remove('hidden');
      populateTeamSelects(); renderAdminTeams();
    } else alert('PIN incorrecto');
  });

  function populateTeamSelects(){
    memberTeamSelect.innerHTML=''; editTeam.innerHTML='';
    data.teams.forEach(t=>{
      const o=document.createElement('option'); o.value=t.id; o.textContent=t.name; memberTeamSelect.appendChild(o);
      const oe=document.createElement('option'); oe.value=t.id; oe.textContent=t.name; editTeam.appendChild(oe);
    });
  }

  // ---------------- ADMIN CRUD ----------------
  formTeam.addEventListener('submit', async e=>{
    e.preventDefault();
    const name=teamName.value.trim(); if(!name) return;
    const teamId=id();
    data.teams.push({id:teamId,name,members:[]});
    await saveTeam({id:teamId,name});
    teamName.value=''; populateTeamSelects(); renderAdminTeams(); renderAll();
  });

  formMember.addEventListener('submit', async e=>{
    e.preventDefault();
    const name=memberName.value.trim(); if(!name) return alert('Nombre requerido');
    const age = memberAge.value ? Number(memberAge.value) : null;
    const gender = memberGender.value;
    const tId = memberTeamSelect.value;
    const file = memberPhoto.files[0];
    const photo = file ? await fileToBase64(file) : null;
    const member = {id:id(),name,age,gender,photo,points:0,team_id:tId};
    const team = data.teams.find(t=>t.id===tId);
    if(!team) return alert('Seleccione equipo');
    team.members.push(member);
    await saveMember(member);
    formMember.reset(); populateTeamSelects(); renderAll(); renderAdminSearch();
  });

  // ---------------- ADMIN SEARCH ----------------
  adminSearch.addEventListener('input', renderAdminSearch);
  async function renderAdminSearch(){
    const term = adminSearch.value.trim().toLowerCase();
    adminResults.innerHTML='';
    const all = data.teams.flatMap(t=>t.members.map(m=>({...m,teamId:t.id,teamName:t.name})));
    const list = all.filter(x=>x.name.toLowerCase().includes(term));
    if(!list.length){ adminResults.innerHTML='<div style="color:var(--muted)">Sin resultados</div>'; return; }
    list.forEach(m=>{
      const d=document.createElement('div'); d.className='admin-item';
      d.innerHTML=`<div style="display:flex;gap:12px;align-items:center">
                      <img src="${m.photo||'images/default.jpg'}" width="52" height="52" style="object-fit:cover;border-radius:8px"/>
                      <div><strong>${m.name}</strong><br><small style="color:var(--muted)">${m.teamName} • ${m.age||'-'}</small></div>
                   </div>
                   <div style="display:flex;gap:6px;align-items:center">
                      <button class="small-btn" data-id="${m.id}" data-action="add">+10</button>
                      <button class="small-btn" data-id="${m.id}" data-action="sub">−10</button>
                      <button class="small-btn" data-id="${m.id}" data-action="edit">✎</button>
                   </div>`;
      adminResults.appendChild(d);
    });
    qsa('#adminResults .small-btn').forEach(b=>{
      b.onclick=async ev=>{
        const mid = ev.currentTarget.dataset.id;
        const action = ev.currentTarget.dataset.action;
        let member,team;
        for(const t of data.teams){ const m=t.members.find(x=>x.id===mid); if(m){ member=m; team=t; break; } }
        if(!member) return;
        if(action==='add'){ member.points+=10; await saveMember(member); renderAll(); renderAdminSearch(); }
        if(action==='sub'){ member.points-=1; await saveMember(member); renderAll(); renderAdminSearch(); } // regla: restar 1
        if(action==='edit'){ openEdit(member.id); }
      };
    });
  }

  // ---------------- MODAL EDIT ----------------
  function openEdit(mid){
    let target=null, parent=null;
    for(const t of data.teams){ const m=t.members.find(x=>x.id===mid); if(m){ target=m; parent=t; break; } }
    if(!target) return;
    editId.value=target.id; editName.value=target.name; editAge.value=target.age||''; editGender.value=target.gender||'o';
    editTeam.innerHTML=''; data.teams.forEach(t=>{
      const o=document.createElement('option'); o.value=t.id; o.textContent=t.name; if(t.id===parent.id)o.selected=true; editTeam.appendChild(o);
    });
    modal.classList.remove('hidden');
  }
  closeModal.addEventListener('click', ()=>{ modal.classList.add('hidden'); editForm.reset(); });

  editForm.addEventListener('submit', async e=>{
    e.preventDefault();
    const mid=editId.value; const name=editName.value.trim(); const age=editAge.value?Number(editAge.value):null;
    const gender=editGender.value; const tId=editTeam.value;
    const file=editPhoto.files[0]; const photo=file?await fileToBase64(file):null;

    let member=null, oldTeam=null, oldIdx=-1;
    for(const t of data.teams){ const idx=t.members.findIndex(x=>x.id===mid); if(idx>=0){ member=t.members[idx]; oldTeam=t; oldIdx=idx; break; } }
    if(!member) return;
    if(oldTeam) oldTeam.members.splice(oldIdx,1);
    member.name=name||member.name; member.age=age; member.gender=gender; if(photo) member.photo=photo;
    const dest = data.teams.find(x=>x.id===tId); if(!dest) return;
    dest.members.push(member);
    await saveMember({...member, team_id:tId});
    modal.classList.add('hidden'); editForm.reset(); renderAll(); renderAdminSearch(); renderAdminTeams();
  });

  deleteBtn.addEventListener('click', async ()=>{
    if(!confirm('¿Eliminar campista?')) return;
    const mid = editId.value;
    for(const t of data.teams){ const idx=t.members.findIndex(x=>x.id===mid); if(idx>=0){ t.members.splice(idx,1); await deleteMemberDB(mid); break; } }
    modal.classList.add('hidden'); renderAll(); renderAdminSearch(); renderAdminTeams();
  });

  // ---------------- RENDER ADMIN ----------------
  function renderAdminTeams(){
    teamsAdminList.innerHTML='';
    data.teams.forEach(t=>{
      const div=document.createElement('div'); div.className='admin-item';
      div.innerHTML=`<div><strong>${t.name}</strong> <small style="color:var(--muted)">${t.members.length} integrantes</small></div>
                     <div style="display:flex;gap:8px">
                        <button class="small-btn" data-id="${t.id}" data-action="rename">Editar</button>
                        <button class="small-btn" data-id="${t.id}" data-action="del">Borrar</button>
                     </div>`;
      teamsAdminList.appendChild(div);
    });
    qsa('#teamsAdminList .small-btn').forEach(async b=>{
      b.onclick=async ev=>{
        const idd=ev.currentTarget.dataset.id;
        const action=ev.currentTarget.dataset.action;
        if(action==='rename'){
          const newName=prompt('Nuevo nombre del equipo:'); if(newName){
            const t=data.teams.find(x=>x.id===idd); if(t){ t.name=newName.trim(); await saveTeam(t); populateTeamSelects(); renderAdminTeams(); renderAll(); }
          }
        } else if(action==='del'){
          if(!confirm('¿Eliminar equipo? se perderán sus miembros')) return;
          data.teams = data.teams.filter(x=>x.id!==idd);
          await supabase.from('teams').delete().eq('id',idd);
          await supabase.from('members').delete().eq('team_id',idd);
          populateTeamSelects(); renderAdminTeams(); renderAll();
        }
      };
    });
  }

  // ---------------- GENERIC ----------------
  function renderAll(){
    renderTeamsTable(); renderPodium(); renderTeamsTop3();
    renderRanking(searchAll.value||''); renderMejores();
  }

  searchAll.addEventListener('input', ()=>renderRanking(searchAll.value||''));

  window.openEdit=openEdit;

  // ---------------- INIT ----------------
  loadData(); showSection('home');
})();
