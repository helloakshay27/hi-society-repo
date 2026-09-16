import { Card, CardHead } from './Card';
import { useSmartSecureDashboard } from '../context/DashboardContext';
import { useLocation } from 'react-router-dom';
import { Skeleton, TableSkeleton } from './Skeleton';

export function KnownDeadAreasCard() {
  const { adopt, appName, isAdoptLoading } = useSmartSecureDashboard();
  const location = useLocation();
  const isQuikgate = appName === 'QuikGate' || location.pathname.includes('quickgate') || location.pathname.includes('quikgate');
  const appLabel = isQuikgate ? 'QuikGate' : 'SmartSecure';
  const { deadAreas } = adopt;

  return (
    <Card
      style={{ marginTop: 12 }}
      id="card-adminTiers"
      infoKey="tierCoverage"
      head={
        <CardHead
          cr="Known-dead areas · reference"
          ct="Disabled-in-code funnels, shown not hidden"
          cd={`Reference card — not a filter. ${appLabel}'s catalogue documents two real areas that are fully wired in code but cannot fire in the current build because nothing routes to their screens. This card surfaces them at true-to-code volume so a reviewer sees the gap directly rather than an unexplained absence from Workflow Usage; it does not change any other number on the dashboard.`}
        />
      }
    >
      {isAdoptLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Skeleton style={{ width: '100%', height: 52, borderRadius: 8 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <Skeleton style={{ height: 64, borderRadius: 8 }} />
            <Skeleton style={{ height: 64, borderRadius: 8 }} />
          </div>
          <TableSkeleton rows={2} cols={3} />
        </div>
      ) : (
        <>
          <div className="bmnote crashnote" style={{ marginBottom: 14 }}>
            <span>⚠️</span>
            <div>
              <b>Device Registration is switched off in the code.</b> Every route into GatekeeperVerficationFormScreen is commented out — splash, login and home no longer block on device approval. The screen, its provider and its route still exist and would still emit all five device_verification_* events; nothing reaches them today. Read the near-empty funnel below as &quot;the gate is disabled,&quot; not as a tracking bug — uncommenting the routing restores the funnel with no analytics change needed.
            </div>
          </div>

          <div className="kv" style={{ marginBottom: 16 }}>
            <div>
              <div className="k">Device Registration — active users</div>
              <div className="v" style={{ fontSize: 20 }}>{deadAreas.deviceRegActive.toLocaleString()}</div>
              <div className="u">5 events · disabled route</div>
            </div>
            <div>
              <div className="k">otp_*&#123;flow=login/registration&#125; — active users</div>
              <div className="v" style={{ fontSize: 20 }}>{deadAreas.loginRegOtpActive.toLocaleString()}</div>
              <div className="u">RegistrationOTPScreen never navigated to</div>
            </div>
          </div>

          <div className="tbl-wrap">
            <table className="pathtbl">
              <thead>
                <tr>
                  <th>Area</th>
                  <th>Status</th>
                  <th className="num">Events affected</th>
                </tr>
              </thead>
              <tbody>
                {deadAreas.rows.map((row) => (
                  <tr key={row.area}>
                    <td>{row.area}</td>
                    <td>
                      <span className={`status ${row.statusClass}`}>{row.status}</span>
                    </td>
                    <td className="num">{row.eventsAffected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  );
}
