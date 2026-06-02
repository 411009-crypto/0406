// Shared data key
const STORAGE_KEY = 'vocabWords'

function loadWords(){
  try{
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  }catch(e){return []}
}

function saveWords(list){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

/* ---------- Index page logic ---------- */
if(location.pathname.endsWith('index.html') || location.pathname === '/' || location.pathname.endsWith('/')){
  const card = document.getElementById('flashcard')
  const front = document.getElementById('card-front')
  const back = document.getElementById('card-back')
  const translationEl = document.getElementById('translation')
  const posEl = document.getElementById('pos')
  const exampleEl = document.getElementById('example')
  const rootsEl = document.getElementById('roots')
  const prevBtn = document.getElementById('prev')
  const nextBtn = document.getElementById('next')
  const idxEl = document.getElementById('idx')

  let words = loadWords()
  let i = 0

  function render(){
    if(!words.length){
      front.textContent = '請至管理頁新增單字'
      translationEl.textContent = ''
      posEl.textContent = ''
      exampleEl.textContent = ''
      rootsEl.textContent = ''
      idxEl.textContent = ''
      return
    }
    const w = words[i]
    front.textContent = w.word
    translationEl.textContent = w.translation || ''
    posEl.textContent = w.pos || ''
    exampleEl.textContent = w.example || ''
    rootsEl.textContent = w.roots || ''
    idxEl.textContent = `${i+1}/${words.length}`
  }

  card.addEventListener('click', ()=>{
    card.classList.toggle('flipped')
  })

  prevBtn.addEventListener('click', ()=>{
    if(!words.length) return
    i = (i - 1 + words.length) % words.length
    card.classList.remove('flipped')
    render()
  })

  nextBtn.addEventListener('click', ()=>{
    if(!words.length) return
    i = (i + 1) % words.length
    card.classList.remove('flipped')
    render()
  })

  // initial render
  render()
}

/* ---------- Admin page logic ---------- */
if(location.pathname.endsWith('admin.html')){
  const form = document.getElementById('word-form')
  const wordInput = document.getElementById('word')
  const transInput = document.getElementById('translation-input')
  const posInput = document.getElementById('pos-input')
  const exampleInput = document.getElementById('example-input')
  const rootsInput = document.getElementById('roots-input')
  const autofillBtn = document.getElementById('autofill')
  const listEl = document.getElementById('word-list')

  let words = loadWords()
  let editingIndex = -1

  function refreshList(){
    listEl.innerHTML = ''
    words.forEach((w, idx)=>{
      const li = document.createElement('li')
      const left = document.createElement('div')
      left.textContent = `${w.word} — ${w.translation || ''}`
      const right = document.createElement('div')
      const edit = document.createElement('button')
      edit.textContent = '編輯'
      edit.className = 'small-btn'
      edit.addEventListener('click', ()=>{loadToForm(idx)})
      const del = document.createElement('button')
      del.textContent = '刪除'
      del.className = 'small-btn'
      del.addEventListener('click', ()=>{if(confirm('確定刪除？')){words.splice(idx,1);saveWords(words);refreshList()}})
      right.appendChild(edit)
      right.appendChild(del)
      li.appendChild(left)
      li.appendChild(right)
      listEl.appendChild(li)
    })
  }

  function loadToForm(idx){
    const w = words[idx]
    editingIndex = idx
    wordInput.value = w.word
    transInput.value = w.translation || ''
    posInput.value = w.pos || ''
    exampleInput.value = w.example || ''
    rootsInput.value = w.roots || ''
  }

  form.addEventListener('submit', (e)=>{
    e.preventDefault()
    const payload = {
      word: wordInput.value.trim(),
      translation: transInput.value.trim(),
      pos: posInput.value.trim(),
      example: exampleInput.value.trim(),
      roots: rootsInput.value.trim()
    }
    if(!payload.word) return alert('請輸入英文單字')
    if(editingIndex >=0){
      words[editingIndex] = payload
      editingIndex = -1
    }else{
      words.push(payload)
    }
    saveWords(words)
    refreshList()
    form.reset()
  })

  autofillBtn.addEventListener('click', async ()=>{
    const word = wordInput.value.trim()
    if(!word) return alert('請先輸入單字再按自動填入')
    autofillBtn.disabled = true
    autofillBtn.textContent = '取得中...'
    try{
      const data = await fetchDictionaryData(word)
      if(data){
        posInput.value = data.pos || ''
        exampleInput.value = data.example || ''
        // try to translate definition to Chinese via libretranslate public instance
        if(data.definition){
          try{
            const tr = await translateText(data.definition, 'en','zh')
            transInput.value = tr || ''
          }catch(e){
            transInput.value = ''
          }
        }
        rootsInput.value = analyzeRoots(word)
      }else{
        alert('找不到相關資料')
      }
    }catch(err){
      console.error(err)
      alert('自動填入發生錯誤')
    }finally{
      autofillBtn.disabled = false
      autofillBtn.textContent = '自動填入'
    }
  })

  // initial
  refreshList()

  /* helper: fetch dictionary info from dictionaryapi.dev */
  async function fetchDictionaryData(word){
    try{
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
      if(!res.ok) return null
      const j = await res.json()
      // pick first meaning/definition
      const m = j[0]?.meanings?.[0]
      const d = m?.definitions?.[0]
      return {
        pos: m?.partOfSpeech || '',
        definition: d?.definition || '',
        example: d?.example || ''
      }
    }catch(e){
      return null
    }
  }

  /* helper: translate text via libretranslate (may be rate-limited/CORS) */
  async function translateText(text, source='en', target='zh'){
    try{
      const res = await fetch('https://libretranslate.de/translate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({q:text,source, target, format:'text'})})
      if(!res.ok) throw new Error('translate fail')
      const j = await res.json()
      return j.translatedText
    }catch(e){
      console.warn('translate failed',e)
      throw e
    }
  }

  /* naive root analysis: check common prefixes/suffixes */
  function analyzeRoots(word){
    const prefixes = ['un','re','in','im','dis','mis','pre','post','sub','inter','trans','con','co']
    const suffixes = ['ing','ed','er','est','ly','ion','ity','ment','ness','able','ible']
    const found = []
    const lw = word.toLowerCase()
    prefixes.forEach(p=>{if(lw.startsWith(p) && lw.length>p.length+2) found.push('prefix:'+p)})
    suffixes.forEach(s=>{if(lw.endsWith(s) && lw.length>s.length+2) found.push('suffix:'+s)})
    return found.join(', ')
  }

}
