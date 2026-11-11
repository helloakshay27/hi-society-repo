export const HELPDESKTAB_HTML: string = `
  <div class="phead boxed mb14">
    <div>
      <div class="eyebrow">Veda Gardens · 59 tickets this period</div>
      <h1 class="ph1">BMS helpdesk — ticket overview</h1>
      <p class="lede">42 of 59 tickets missed first-response targets — the team is short on assignment or staffing bandwidth.</p>
    </div>
  </div>

  <div class="hd-shell mb14">
    <div class="g6 num">
      <div class="stat">
        <span class="ic"><i data-lucide="ticket" style="width:16px;height:16px"></i></span>
        <span class="lbl">Total tickets<button class="info-btn" data-info="kpi_top_total_tickets" aria-label="About Total tickets"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><line x1="12" y1="16.2" x2="12" y2="11"/><circle cx="12" cy="7.4" r="0.6" fill="currentColor" stroke="none"/></svg></button></span>
        <span class="val">59</span>
        <span class="sub">This period · All statuses</span>
      </div>
      <div class="stat">
        <span class="ic"><i data-lucide="inbox" style="width:16px;height:16px"></i></span>
        <span class="lbl">Open tickets<button class="info-btn" data-info="kpi_top_open_tickets" aria-label="About Open tickets"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><line x1="12" y1="16.2" x2="12" y2="11"/><circle cx="12" cy="7.4" r="0.6" fill="currentColor" stroke="none"/></svg></button></span>
        <span class="val">49</span>
        <span class="sub">8 in progress · 72% assigned</span>
      </div>
      <div class="stat">
        <span class="ic"><i data-lucide="clock" style="width:16px;height:16px"></i></span>
        <span class="lbl">Response breached<button class="info-btn" data-info="kpi_top_response_breached" aria-label="About Response breached"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><line x1="12" y1="16.2" x2="12" y2="11"/><circle cx="12" cy="7.4" r="0.6" fill="currentColor" stroke="none"/></svg></button></span>
        <span class="val">42</span>
        <span class="sub">71% of tickets · target 0%</span>
      </div>
      <div class="stat">
        <span class="ic"><i data-lucide="alert-triangle" style="width:16px;height:16px"></i></span>
        <span class="lbl">Resolution breached<button class="info-btn" data-info="kpi_top_resolution_breached" aria-label="About Resolution breached"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><line x1="12" y1="16.2" x2="12" y2="11"/><circle cx="12" cy="7.4" r="0.6" fill="currentColor" stroke="none"/></svg></button></span>
        <span class="val">38</span>
        <span class="sub">64% of tickets · target 0%</span>
      </div>
      <div class="stat">
        <span class="ic"><i data-lucide="activity" style="width:16px;height:16px"></i></span>
        <span class="lbl">Proactive tickets<button class="info-btn" data-info="kpi_top_proactive_tickets" aria-label="About Proactive tickets"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><line x1="12" y1="16.2" x2="12" y2="11"/><circle cx="12" cy="7.4" r="0.6" fill="currentColor" stroke="none"/></svg></button></span>
        <span class="val">35</span>
        <span class="sub">59% ratio · Target 70%+</span>
      </div>
      <div class="stat">
        <span class="ic"><i data-lucide="star" style="width:16px;height:16px"></i></span>
        <span class="lbl">Golden tickets<button class="info-btn" data-info="kpi_top_golden_tickets" aria-label="About Golden tickets"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><line x1="12" y1="16.2" x2="12" y2="11"/><circle cx="12" cy="7.4" r="0.6" fill="currentColor" stroke="none"/></svg></button></span>
        <span class="val">4</span>
        <span class="sub">2 P1 · senior residents</span>
      </div>
    </div>

    <div class="nstack" id="notices">
      <span class="layer l2"></span><span class="layer l1"></span>
      <div class="notice">
        <div class="nhead">
          <span class="pill" data-n="pill"></span>
          <span class="ncount" data-n="count"></span>
          <span class="spacer"></span>
          <button type="button" class="nav" data-n="prev" aria-label="Previous"><i data-lucide="chevron-left" style="width:14px;height:14px"></i></button>
          <button type="button" class="nav" data-n="next" aria-label="Next"><i data-lucide="chevron-right" style="width:14px;height:14px"></i></button>
        </div>
        <h4 data-n="title"></h4>
        <p data-n="body"></p>
        <button type="button" class="go" data-drill="resp_breach"><span data-n="cta"></span><i data-lucide="arrow-right" style="width:14px;height:14px"></i></button>
      </div>
    </div>
  </div>

  <section id="proactiveReactiveCard" class="card mb14" style="display:none">
    <div class="chead">
      <h3 class="ch3">Proactive vs Reactive<button class="info-btn" onclick="showInfo('proactiveChart',this,event)" aria-label="About Proactive vs Reactive"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><line x1="12" y1="16.2" x2="12" y2="11"/><circle cx="12" cy="7.4" r="0.6" fill="currentColor" stroke="none"/></svg></button></h3>
      <span class="b bwa" data-proactive-target>Target: 70% Proactive</span>
    </div>
    <div class="ci am" style="margin-bottom:0">
      <div class="ci-h" data-proactive-insight></div>
      <div class="ci-a" data-proactive-action></div>
    </div>
    <div class="chx" style="height:260px"><canvas id="proactiveChart"></canvas></div>
  </section>

  <div class="g3 mb14">
    <section class="card">
      <div class="chead">
        <div>
          <h3 class="ch3">Ticket status<button class="info-btn" onclick="showInfo('ticketStatusChart',this,event)" aria-label="About Ticket status"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><line x1="12" y1="16.2" x2="12" y2="11"/><circle cx="12" cy="7.4" r="0.6" fill="currentColor" stroke="none"/></svg></button></h3>
          <p class="csub2">Where the 59 tickets sit</p>
        </div>
      </div>
      <div class="chx" style="height:160px"><canvas id="ticketStatusChart"></canvas></div>
    </section>
    <section class="card">
      <div class="chead">
        <div>
          <h3 class="ch3">Ticket source<button class="info-btn" onclick="showInfo('modeChart',this,event)" aria-label="About Ticket source"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><line x1="12" y1="16.2" x2="12" y2="11"/><circle cx="12" cy="7.4" r="0.6" fill="currentColor" stroke="none"/></svg></button></h3>
          <p class="csub2">Complaint mode, by channel</p>
        </div>
      </div>
      <div class="chx" style="height:160px"><canvas id="modeChart"></canvas></div>
    </section>
    <section class="card">
      <div class="chead">
        <div>
          <h3 class="ch3">Volume by tower<button class="info-btn" onclick="showInfo('tbl_top_tower_wise_ticket_volume',this,event)" aria-label="About Volume by tower"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><line x1="12" y1="16.2" x2="12" y2="11"/><circle cx="12" cy="7.4" r="0.6" fill="currentColor" stroke="none"/></svg></button></h3>
          <p class="csub2">Tickets raised this period</p>
        </div>
      </div>
      <div class="hbars num" style="--lbl:128px">
        <div class="hbar"><span>FM</span><div class="htrack"><i style="width:100%"></i></div><b>22</b></div>
        <div class="hbar"><span>T1</span><div class="htrack"><i style="width:82%"></i></div><b>18</b></div>
        <div class="hbar"><span>T3</span><div class="htrack"><i style="width:55%"></i></div><b>12</b></div>
        <div class="hbar"><span>T2</span><div class="htrack"><i style="width:32%"></i></div><b>7</b></div>
      </div>
    </section>
  </div>

  <div class="ins mb14">
    <span class="ins-tile"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5 13.9 10 20.5 12l-6.6 2L12 20.5 10.1 14 3.5 12l6.6-2z"/></svg></span>
    <span class="tagai">AI INSIGHT</span>
    <p>FM raises the most tickets, and 32% of all tickets are logged by staff from Common Area and Apartment — matching the low app adoption in FM and T3.</p>
    <div class="ins-act"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>Check whether staff-logged tickets concentrate in FM and T3; fixing adoption there cuts staff workload too.</div>
  </div>

  <div class="g2 mb14">
    <section class="card">
      <div class="chead">
        <div>
          <h3 class="ch3">Response vs Resolution escalation<button class="info-btn" onclick="showInfo('escalationChart',this,event)" aria-label="About Response vs Resolution escalation"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><line x1="12" y1="16.2" x2="12" y2="11"/><circle cx="12" cy="7.4" r="0.6" fill="currentColor" stroke="none"/></svg></button></h3>
          <p class="csub2">Of 59 tickets this period</p>
        </div>
      </div>
      <div class="hbars num" style="--lbl:160px">
        <div class="hbar"><span>Response breached <small>(42)</small></span><div class="htrack"><i style="width:71%"></i></div><b>71%</b></div>
        <div class="hbar"><span>Resolution breached <small>(38)</small></span><div class="htrack"><i style="width:64%"></i></div><b>64%</b></div>
      </div>
      <div class="ins">
        <span class="ins-tile"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5 13.9 10 20.5 12l-6.6 2L12 20.5 10.1 14 3.5 12l6.6-2z"/></svg></span>
        <span class="tagai">AI INSIGHT</span>
        <p>Both Response and Resolution escalations are being breached. Response at 71% is the more urgent gap — tickets aren't being picked up fast enough.</p>
        <div class="ins-act"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>Set up auto-assignment rules for Housekeeping and Electrical.</div>
      </div>
    </section>

    <section class="card">
      <div class="chead">
        <div>
          <h3 class="ch3">Response breach by category<button class="info-btn" onclick="showInfo('categoryChart',this,event)" aria-label="About Response breach by category"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><line x1="12" y1="16.2" x2="12" y2="11"/><circle cx="12" cy="7.4" r="0.6" fill="currentColor" stroke="none"/></svg></button></h3>
          <p class="csub2">Dashed line is the 71% society average</p>
        </div>
      </div>
      <div>
        <div class="hbars num" style="--lbl:110px">
          <div class="hbar"><span>Housekeeping <small>(28)</small></span><div class="htrack"><i class="hl-bad" style="width:85%"></i><span class="ref" style="left:71%"></span></div><b>85%</b></div>
          <div class="hbar"><span>Other <small>(3)</small></span><div class="htrack"><i style="width:67%"></i><span class="ref" style="left:71%"></span></div><b>67%</b></div>
          <div class="hbar"><span>Plumbing <small>(5)</small></span><div class="htrack"><i style="width:60%"></i><span class="ref" style="left:71%"></span></div><b>60%</b></div>
          <div class="hbar"><span>Electrical <small>(15)</small></span><div class="htrack"><i style="width:60%"></i><span class="ref" style="left:71%"></span></div><b>60%</b></div>
          <div class="hbar"><span>Civil <small>(8)</small></span><div class="htrack"><i style="width:50%"></i><span class="ref" style="left:71%"></span></div><b>50%</b></div>
        </div>
        <div class="axis" style="margin-top:8px;--lbl:110px"><span></span><div><span>0%</span><span>50%</span><span>100%</span></div><span></span></div>
      </div>
      <div class="ins">
        <span class="ins-tile"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5 13.9 10 20.5 12l-6.6 2L12 20.5 10.1 14 3.5 12l6.6-2z"/></svg></span>
        <span class="tagai">AI INSIGHT</span>
        <p>Housekeeping breaches 85% of the time and makes up over half of all breached tickets.</p>
        <div class="ins-act"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>Give Housekeeping a dedicated response-time fix, not a general SLA push.</div>
      </div>
    </section>
  </div>

  <section class="table age">
    <div class="chead">
      <div>
        <h3 class="ch3">Ticket ageing<button class="info-btn" onclick="showInfo('tbl_top_tickets_ageing_matrix',this,event)" aria-label="About Ticket ageing"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><line x1="12" y1="16.2" x2="12" y2="11"/><circle cx="12" cy="7.4" r="0.6" fill="currentColor" stroke="none"/></svg></button></h3>
        <p class="csub2">Priority × days open — click a cell to see its tickets</p>
      </div>
      <span class="sub">Avg open age 6.4 days · avg resolution 1 day</span>
    </div>
    <div class="tbox">
      <div class="grid-head"><span>Priority</span><span>0–3 days</span><span>4–7 days</span><span>8–14 days</span><span>15–30 days</span><span>30+ days</span><span>Total</span></div>
      <div class="num" id="ageing"></div>
    </div>
    <div class="ins">
      <span class="ins-tile"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5 13.9 10 20.5 12l-6.6 2L12 20.5 10.1 14 3.5 12l6.6-2z"/></svg></span>
      <span class="tagai">AI INSIGHT</span>
      <p>13 P2 tickets are past the 7-day limit, and 14 P3 tickets have been open over two weeks.</p>
      <div class="ins-act"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>Escalate anything past its SLA column to the FM head.</div>
    </div>
  </section>
`;
