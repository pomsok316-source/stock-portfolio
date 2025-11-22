import React, { useState, useEffect } from "react";
import "./App.css"; // 👈 스타일을 여기에 넣습니다.

const KR_HOLIDAYS = ["2025-01-01", "2025-03-01", "2025-05-05"];
const US_HOLIDAYS = [
  "2025-01-01", "2025-01-20", "2025-02-17", "2025-04-18", "2025-05-26",
  "2025-06-19", "2025-07-04", "2025-09-01", "2025-10-13", "2025-11-11",
  "2025-11-27", "2025-12-25"
];

const formatKoreanDate = (dateStr) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일 ${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}:${d.getSeconds().toString().padStart(2,"0")}`;
};

function App() {
  const currentYear = new Date().getFullYear();
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("");
  const [totalInvestment, setTotalInvestment] = useState(0);
  const [stocks, setStocks] = useState([{ name: "", ratio: "", start: "", end: "", country: "US" }]);
  const [savedPortfolios, setSavedPortfolios] = useState(
    JSON.parse(localStorage.getItem("portfolios") || "[]")
  );
  const [compareList, setCompareList] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [extraHolidays, setExtraHolidays] = useState(
    JSON.parse(localStorage.getItem("extraHolidays") || JSON.stringify({ KR: {}, US: {} }))
  );

  useEffect(() => {
    if (!extraHolidays.KR[currentYear]) extraHolidays.KR[currentYear] = [];
    if (!extraHolidays.US[currentYear]) extraHolidays.US[currentYear] = [];
    localStorage.setItem("extraHolidays", JSON.stringify(extraHolidays));
    setExtraHolidays({ ...extraHolidays });
  }, [currentYear]);

  const addStock = () => setStocks([...stocks, { name: "", ratio: 0, start: "", end: "", country: "US" }]);
  const deleteStock = (index) => setStocks(stocks.filter((_, i) => i !== index));
  const handleStockChange = (index, field, value) => {
    const newStocks = [...stocks];
    newStocks[index][field] = value;
    setStocks(newStocks);
  };

  const copyDatesFromPrevious = (index) => {
    if (index === 0) return;
    const newStocks = [...stocks];
    newStocks[index].start = newStocks[index - 1].start;
    newStocks[index].end = newStocks[index - 1].end;
    setStocks(newStocks);
  };

  const calculateWorkingDays = (start, end, country) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    let count = 0;
    const holidays = country === "KR" ? KR_HOLIDAYS : US_HOLIDAYS;
    const extra = extraHolidays[country]?.[currentYear] || [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const day = d.getDay();
      const dateStr = d.toISOString().slice(0, 10);
      if (day !== 0 && day !== 6 && !holidays.includes(dateStr) && !extra.includes(dateStr)) {
        count++;
      }
    }
    return count;
  };

  const handleSaveNew = () => {
    const portfolio = {
      title, owner, totalInvestment, stocks: [...stocks], createdAt: new Date().toISOString(),
    };
    const updated = [...savedPortfolios, portfolio];
    setSavedPortfolios(updated);
    localStorage.setItem("portfolios", JSON.stringify(updated));
    setEditIndex(null);
    alert("새 포트폴리오로 저장되었습니다!");
  };

  const handleUpdate = () => {
    if (editIndex === null) return;
    const portfolio = {
      title, owner, totalInvestment, stocks: [...stocks], createdAt: new Date().toISOString(),
    };
    let updated = [...savedPortfolios];
    updated[editIndex] = portfolio;
    setSavedPortfolios(updated);
    localStorage.setItem("portfolios", JSON.stringify(updated));
    setEditIndex(null);
    alert("포트폴리오가 수정되었습니다!");
  };

  const loadPortfolio = (index) => {
    const p = savedPortfolios[index];
    setTitle(p.title);
    setOwner(p.owner);
    setTotalInvestment(p.totalInvestment);
    setStocks([...p.stocks]);
    setEditIndex(index);
  };

  const deletePortfolio = (index) => {
    const updated = savedPortfolios.filter((_, i) => i !== index);
    setSavedPortfolios(updated);
    localStorage.setItem("portfolios", JSON.stringify(updated));
  };

  const handleCompareSelect = (index, checked) => {
    let updated = [...compareList];
    if (checked) updated.push(savedPortfolios[index]);
    else updated = updated.filter((p) => p !== savedPortfolios[index]);
    setCompareList(updated);
  };

  const totalRatio = stocks.reduce((a, s) => a + Number(s.ratio), 0);
  const totalInvestSum = stocks.reduce((a,s) => a + ((totalInvestment * Number(s.ratio || 0))/100), 0);

  return (
    <div className="container">
      <div className="left-panel">
      <h1 className="main-title">📊 투자 포트폴리오 작성</h1>

      <div className="card">
        <div className="input-row">
          <input type="text" placeholder="포트폴리오 제목" value={title} onChange={(e)=>setTitle(e.target.value)} />
          <input type="text" placeholder="이름" value={owner} onChange={(e)=>setOwner(e.target.value)} />
          <input
            type="text"
            placeholder="총투자액"
            value={totalInvestment ? totalInvestment.toLocaleString() : ""}
            onChange={(e) => {
              const raw = e.target.value.replace(/,/g, "");
              if (raw === "") setTotalInvestment(0);
              else if (!isNaN(raw)) setTotalInvestment(Number(raw));
            }}
          />
        </div>
      </div>

      <div className="card">
        <h2>종목별 입력</h2>
        {stocks.map((s, i) => (
          <div key={i} className="stock-row">
            <input type="text" placeholder="종목이름" value={s.name} onChange={(e)=>handleStockChange(i,"name",e.target.value)} />
            <input type="number" placeholder="비율(%)" value={s.ratio} onChange={(e)=>handleStockChange(i,"ratio",e.target.value)} />
            <input type="date" value={s.start} onChange={(e)=>handleStockChange(i,"start",e.target.value)} />
            <input type="date" value={s.end} onChange={(e)=>handleStockChange(i,"end",e.target.value)} />
            <select value={s.country} onChange={(e)=>handleStockChange(i,"country",e.target.value)}>
              <option value="KR">🇰🇷</option>
              <option value="US">🇺🇸</option>
            </select>
            <div className="button-group">
              <button className="small-btn gray" onClick={()=>copyDatesFromPrevious(i)}>날짜복사</button>
              <button className="small-btn red" onClick={()=>deleteStock(i)}>삭제</button>
            </div>
          </div>
        ))}
        <button className="btn green" onClick={addStock}>+ 종목추가</button>
      </div>

      <div className="summary-card">
        <p>총 비율 합: <b className={totalRatio>100?"red-text":""}>{totalRatio}%</b></p>
        <p>총 투자금 합: {totalInvestSum}</p>
      </div>

      <div className="button-row">
        <button className="btn blue" onClick={handleSaveNew}>새 저장</button>
        {editIndex !== null && <button className="btn yellow" onClick={handleUpdate}>수정 (덮어쓰기)</button>}
      </div>

      <hr className="divider" />

      <h2 className="section-title">💼 저장된 포트폴리오</h2>
      <div className="saved-list">
        {savedPortfolios.map((p,i)=>(
          <div key={i} className="saved-item">
            <div>
              <strong>{p.title}</strong> ({p.owner})  
              <small> - {formatKoreanDate(p.createdAt)}</small>
            </div>
            <div className="actions">
              <button className="small-btn yellow" onClick={()=>loadPortfolio(i)}>불러오기</button>
              <button className="small-btn red" onClick={()=>deletePortfolio(i)}>삭제</button>
              <input type="checkbox" onChange={(e)=>handleCompareSelect(i,e.target.checked)} />
            </div>
          </div>
        ))}
      </div>
      </div>
      
      <div className="right-panel">
      {compareList.length>0 && (
        <div className="compare-section">
          {compareList.map((p,i)=>(
            <div key={i} className="compare-card">
              <h3>{p.title} ({p.owner})</h3>
              <p>총투자액: {Number(p.totalInvestment).toLocaleString()}</p>
              <table>
                <thead>
                  <tr>
                    <th>종목</th><th>비율</th><th>총 투자금</th><th>하루 투자금</th>
                  </tr>
                </thead>
                <tbody>
                  {p.stocks.map((s,j)=>{
                    const workingDays = calculateWorkingDays(s.start,s.end,s.country);
                    const investAmount = Math.round((p.totalInvestment * s.ratio)/100);
                    const dailyInvest = workingDays>0 ? Math.round(investAmount/workingDays) : 0;
                    return (
                      <tr key={j}>
                        <td>{s.name}</td>
                        <td>{Math.round(s.ratio)}%</td>
                        <td>{investAmount.toLocaleString()}</td>
                        <td>{dailyInvest.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
    </div>
  );
}

export default App;
