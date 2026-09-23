export default function ArticlesLoading(){
  return <main className="dashboard-shell article-library-page" aria-busy="true" aria-label="در حال بارگذاری مقالات">
    <div className="article-loading-skeleton"><span/><span/><span/></div>
    <section className="editor-state-card article-loading-card"><span className="loading-pulse"/><span className="loading-pulse"/><span className="loading-pulse"/></section>
  </main>;
}
