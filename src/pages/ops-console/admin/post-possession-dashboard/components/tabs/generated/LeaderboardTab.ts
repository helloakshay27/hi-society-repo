export const LEADERBOARDTAB_HTML: string = `
  <div class="phead boxed mb14">
    <div>
      <div class="eyebrow">Super admin view · 27 June 2026 · All towers compared</div>
      <h1 class="ph1">Tower leaderboard</h1>
      <p class="lede">A composite health score ranks all 4 towers on the same 6 dimensions: SLA compliance, security patrol, club activation, fitout approval, staffing coverage and possession CSAT. Click any tower for the full breakdown.</p>
    </div>
    <div class="callouts">
      <button type="button" class="callout" onclick="openD('tower_t2')">
        <i class="cdot" style="background:var(--growth)"></i>
        <span><b>Best — Tower T2</b><span class="sub">Composite 87 · improving</span></span>
        <i data-lucide="chevron-right" style="width:16px;height:16px;color:var(--ink-muted);margin-left:auto;flex-shrink:0"></i>
      </button>
      <button type="button" class="callout" onclick="openD('tower_fm')">
        <i class="cdot" style="background:var(--danger)"></i>
        <span><b>Worst — Tower FM</b><span class="sub">Composite 52 · declining</span></span>
        <i data-lucide="chevron-right" style="width:16px;height:16px;color:var(--ink-muted);margin-left:auto;flex-shrink:0"></i>
      </button>
    </div>
  </div>

  <section class="table-block mb14">
    <div class="chead">
      <div>
        <h3 class="ch3">Ranked scorecard<button class="info-btn" onclick="showInfo('tbl_tlb_ranked_scorecard',this,event)" aria-label="About Ranked scorecard"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><line x1="12" y1="16.2" x2="12" y2="11"/><circle cx="12" cy="7.4" r="0.6" fill="currentColor" stroke="none"/></svg></button></h3>
        <p class="csub2">Composite is the equal-weighted average of all 6 dimensions, normalised to 0–100</p>
      </div>
      <span class="sub">4 towers · 6 dimensions</span>
    </div>
    <div class="tbox">
      <table class="tbl lb-tbl">
        <thead>
          <tr>
            <th>Rank</th><th>Tower</th><th>Score</th><th>Trend</th>
            <th class="r">SLA</th><th class="r">Patrol</th><th class="r">Club</th>
            <th class="r">Fitout</th><th class="r">Staffing</th><th class="r">CSAT</th>
            <th>Primary issue</th>
          </tr>
        </thead>
        <tbody>
          <tr onclick="openD('tower_t2')">
            <td>1</td><td class="strong">T2</td><td class="strong">87</td>
            <td><span class="pill p-good">↑ Improving</span></td>
            <td class="r">92%</td><td class="r">96%</td><td class="r">68%</td>
            <td class="r">2.1d · 22%</td><td class="r">94%</td><td class="r">4.3</td>
            <td>No major issues</td>
          </tr>
          <tr onclick="openD('tower_t1')">
            <td>2</td><td class="strong">T1</td><td class="strong">74</td>
            <td><span class="pill">→ Stable</span></td>
            <td class="r">78%</td><td class="r">90%</td><td class="r hot">41%</td>
            <td class="r">3.4d · 45%</td><td class="r">85%</td><td class="r">3.8</td>
            <td class="muted">Club activation lagging</td>
          </tr>
          <tr onclick="openD('tower_t3')">
            <td>3</td><td class="strong">T3</td><td class="strong">61</td>
            <td><span class="pill p-bad">↓ Declining</span></td>
            <td class="r">65%</td><td class="r">88%</td><td class="r hot">22%</td>
            <td class="r hot">4.8d · 58%</td><td class="r">79%</td><td class="r">3.5</td>
            <td class="muted">Lowest app adoption (17%)</td>
          </tr>
          <tr onclick="openD('tower_fm')">
            <td>4</td><td class="strong">FM</td><td class="strong">52</td>
            <td><span class="pill p-bad">↓ Declining</span></td>
            <td class="r hot">58%</td><td class="r">91%</td><td class="r hot">19%</td>
            <td class="r hot">5.2d · 61%</td><td class="r">81%</td><td class="r hot">3.2</td>
            <td class="strong">Slowest fitout, likely driving society-wide CSAT decline</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="foot">Fitout = average approval time · rejection rate. Values in bold are below target.</p>
    <div class="ins">
      <span class="ins-tile"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5 13.9 10 20.5 12l-6.6 2L12 20.5 10.1 14 3.5 12l6.6-2z"/></svg></span>
      <span class="tagai">AI INSIGHT</span>
      <p>Tower FM has both the lowest composite score (52) and the slowest fitout approval (5.2 days) with the highest rejection rate (61%) of any tower. This lines up with the society-wide Possession Timeliness finding on Overview — FM is very likely the tower driving the decline, not a diffuse society-wide problem.</p>
      <div class="ins-act"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>Fix FM's fitout workflow first — plausibly the single highest-leverage fix for society-wide possession CSAT.</div>
    </div>
  </section>

  <div class="g c2">
    <section class="card">
      <div class="chead">
        <div>
          <h3 class="ch3">Composite score by tower<button class="info-btn" onclick="showInfo('towerCompositeChart',this,event)" aria-label="About Composite score by tower"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><line x1="12" y1="16.2" x2="12" y2="11"/><circle cx="12" cy="7.4" r="0.6" fill="currentColor" stroke="none"/></svg></button></h3>
          <p class="csub2">0–100</p>
        </div>
      </div>
      <div class="hbars num">
        <div class="hbar"><span>T2</span><div class="htrack"><i style="width:87%"></i></div><b>87</b></div>
        <div class="hbar"><span>T1</span><div class="htrack"><i style="width:74%"></i></div><b>74</b></div>
        <div class="hbar"><span>T3</span><div class="htrack"><i style="width:61%"></i></div><b>61</b></div>
        <div class="hbar"><span>FM</span><div class="htrack"><i style="width:52%"></i></div><b>52</b></div>
      </div>
      <div class="ins">
        <span class="ins-tile"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5 13.9 10 20.5 12l-6.6 2L12 20.5 10.1 14 3.5 12l6.6-2z"/></svg></span>
        <span class="tagai">AI INSIGHT</span>
        <p>A 35-point gap separates the best and worst tower on the exact same 6 metrics. This is the single number a Super Admin should scan first.</p>
        <div class="ins-act"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>Investigate FM before it drags the society average down further.</div>
      </div>
    </section>
    <section class="card">
      <div class="chead">
        <div>
          <h3 class="ch3">Fitout rejection rate by tower<button class="info-btn" onclick="showInfo('towerRejectionChart',this,event)" aria-label="About Fitout rejection rate by tower"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><line x1="12" y1="16.2" x2="12" y2="11"/><circle cx="12" cy="7.4" r="0.6" fill="currentColor" stroke="none"/></svg></button></h3>
          <p class="csub2">Share of fitout requests rejected this month</p>
        </div>
      </div>
      <div class="hbars num">
        <div class="hbar"><span>T2</span><div class="htrack"><i style="width:22%"></i></div><b>22%</b></div>
        <div class="hbar"><span>T1</span><div class="htrack"><i style="width:45%"></i></div><b>45%</b></div>
        <div class="hbar"><span>T3</span><div class="htrack"><i style="width:58%"></i></div><b>58%</b></div>
        <div class="hbar"><span>FM</span><div class="htrack"><i style="width:61%"></i></div><b>61%</b></div>
      </div>
      <div class="ins">
        <span class="ins-tile"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5 13.9 10 20.5 12l-6.6 2L12 20.5 10.1 14 3.5 12l6.6-2z"/></svg></span>
        <span class="tagai">AI INSIGHT</span>
        <p>FM's 61% and T3's 58% are both far above T2's 22%. Fitout feeds the composite score and possession CSAT, so fixing these two towers pays off on two scorecards at once.</p>
        <div class="ins-act"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>Use T2's fitout workflow as the template for FM and T3.</div>
      </div>
    </section>
  </div>
`;
