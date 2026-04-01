(async () => {
  try {
    const response = await fetch('http://localhost:3000/api/blog?all=true');
    const data = await response.json();
    console.log('Total posts:', data.length);
    console.log('Posts:', data.map(p => ({ title: p.title, category: p.category })));
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
