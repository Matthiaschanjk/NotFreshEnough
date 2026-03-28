
import type { JudgeProjectResponse, PersonaEnvelope } from "../types/judgement";
import { PersonaBlock } from "./PersonaBlock";
import { TinyFishFindings } from "./TinyFishFindings";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import StarIcon from '@mui/icons-material/Star';
import GradeIcon from '@mui/icons-material/Grade';



function PersonaMeta({ envelope }: { envelope: PersonaEnvelope<unknown> }) {
  if (envelope.status === "error") {
    return <p className="font-body text-sm text-cinnabar">{envelope.error?.message ?? "This relative refused to speak."}</p>;
  }

  if (envelope.source === "fallback") {
    return <p className="font-body text-xs uppercase tracking-[0.16em] text-ink/35">Rule-based fallback mode</p>;
  }

  return null;
}

export function ResultsReport({
  result,
}: {
  result: JudgeProjectResponse;
}) {
  const auntyQuestions = result.panel.aunty.data?.questions ?? [];
  const ahGong = result.panel.ahGong.data;
  const recommendations = result.panel.korkorRecommendations.data?.recommendations ?? [];
  const refurbished = result.panel.korkorRefurbished.data;




  return (
    <section className="flex flex-col items-center gap-12">
      {/* Modern, Sleek Report Card */}
      <Paper elevation={8} sx={{
        position: 'relative',
        mx: 'auto',
        width: '100%',
        maxWidth: 480,
        borderRadius: '2.5rem',
        p: { xs: 3, md: 5 },
        background: 'linear-gradient(135deg, #fffbe6 0%, #f9f6ef 60%, #ffe9b3 100%)',
        boxShadow: '0 8px 32px 0 rgba(230,180,74,0.22), 0 0 0 6px #ffe9b3',
        border: '4px solid',
        borderImage: 'linear-gradient(90deg, #e6b44a 0%, #fffbe6 50%, #e6b44a 100%) 1',
        overflow: 'visible',
      }}>
        {/* Shine overlay */}
        <Box sx={{
          position: 'absolute',
          top: 0, left: 0, right: 0, height: 18,
          background: 'linear-gradient(90deg,rgba(255,255,255,0.45) 0%,rgba(255,255,255,0.12) 100%)',
          borderTopLeftRadius: '2.5rem',
          borderTopRightRadius: '2.5rem',
          zIndex: 2,
        }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, mb: 2 }}>
          <EmojiEventsIcon sx={{ fontSize: 44, color: '#e6b44a', mb: 0.5, filter: 'drop-shadow(0 2px 8px #e6b44a88)' }} />
          <Typography variant="h3" sx={{ fontFamily: 'serif', fontWeight: 700, color: '#222', letterSpacing: 1, textAlign: 'center', mb: 0.5 }}>
            REPORT CARD
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <GradeIcon sx={{ fontSize: 32, color: '#8b1c1c' }} />
            <Typography variant="h4" sx={{ fontFamily: 'serif', fontWeight: 700, color: '#8b1c1c', letterSpacing: 1, textAlign: 'center' }}>
              OVERALL GRADE: <span style={{ color: '#bfa14a', textShadow: '0 2px 8px #e6b44a88' }}>{result.analysis.scores.overallGrade}</span>
            </Typography>
            <StarIcon sx={{ fontSize: 32, color: '#e6b44a' }} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%', alignItems: 'center', mt: 2 }}>
          {auntyQuestions.length > 0 ? auntyQuestions.map((question, i) => (
            <Card key={i} elevation={6} sx={{
              width: '100%',
              maxWidth: 340,
              mx: 'auto',
              background: 'linear-gradient(135deg, #ffe9b3 0%, #f7e2a2 60%, #e6b44a 100%)',
              border: '3px solid #e6b44a',
              borderRadius: '1.5rem',
              boxShadow: '0 4px 24px 0 rgba(230,180,74,0.22), 0 0 0 8px #f7e2a2',
              position: 'relative',
              overflow: 'visible',
              p: 0,
            }}>
              <CardContent sx={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                p: 3, pb: 3.5,
              }}>
                <Typography variant="h6" sx={{ fontFamily: 'serif', color: '#222', fontWeight: 600, textAlign: 'center', fontSize: 20, letterSpacing: 0.5, lineHeight: 1.4 }}>
                  {question}
                </Typography>
              </CardContent>
              {/* Gold shine accent */}
              <Box sx={{
                position: 'absolute',
                top: 0, left: 0, right: 0, height: 10,
                background: 'linear-gradient(90deg,rgba(255,255,255,0.25) 0%,rgba(255,255,255,0.08) 100%)',
                borderTopLeftRadius: '1.5rem',
                borderTopRightRadius: '1.5rem',
                zIndex: 2,
              }} />
            </Card>
          )) : (
            <Card elevation={6} sx={{
              width: '100%',
              maxWidth: 340,
              mx: 'auto',
              background: 'linear-gradient(135deg, #ffe9b3 0%, #f7e2a2 60%, #e6b44a 100%)',
              border: '3px solid #e6b44a',
              borderRadius: '1.5rem',
              boxShadow: '0 4px 24px 0 rgba(230,180,74,0.22), 0 0 0 8px #f7e2a2',
              position: 'relative',
              overflow: 'visible',
              p: 0,
            }}>
              <CardContent sx={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                p: 3, pb: 3.5,
              }}>
                <Typography variant="h6" sx={{ fontFamily: 'serif', color: '#222', fontWeight: 600, textAlign: 'center', fontSize: 20, letterSpacing: 0.5, lineHeight: 1.4 }}>
                  Aunty is silently disappointed.
                </Typography>
              </CardContent>
              <Box sx={{
                position: 'absolute',
                top: 0, left: 0, right: 0, height: 10,
                background: 'linear-gradient(90deg,rgba(255,255,255,0.25) 0%,rgba(255,255,255,0.08) 100%)',
                borderTopLeftRadius: '1.5rem',
                borderTopRightRadius: '1.5rem',
                zIndex: 2,
              }} />
            </Card>
          )}
        </Box>
      </Paper>

      {/* MUI Stats Bar */}
      <Box sx={{ width: '100%', maxWidth: 900, bgcolor: 'white', border: '2px solid #e6b44a', borderRadius: 6, boxShadow: 4, px: { xs: 2, md: 6 }, py: { xs: 4, md: 6 }, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 6, alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflow: 'hidden', fontFamily: 'serif' }}>
        {/* Circular overall chart */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 140 }}>
          <Box sx={{ position: 'relative', display: 'inline-flex', mb: 1 }}>
            <CircularProgress variant="determinate" value={result.analysis.scores.overall * 10} size={110} thickness={6} sx={{ color: '#e6b44a', backgroundColor: '#f9f6ef', borderRadius: '50%' }} />
            <Box sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              flexDirection: 'column',
            }}>
              <Typography variant="h4" component="div" color="#8b1c1c" fontWeight="bold" fontFamily="serif">
                {result.analysis.scores.overall?.toFixed(1)}
              </Typography>
              <Typography variant="body2" color="#bfa14a" fontFamily="serif">Overall</Typography>
            </Box>
          </Box>
        </Box>
        {/* Stat progress bars */}
        <Box sx={{ flex: 1, width: '100%', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          {[
            { label: 'Clarity', value: result.analysis.scores.clarity, color: '#34c759' },
            { label: 'Completeness', value: result.analysis.scores.completeness, color: '#e4572e' },
            { label: 'Differentiation', value: result.analysis.scores.differentiation, color: '#e6b44a' },
            { label: 'Usability', value: result.analysis.scores.usability, color: '#3b82f6' },
            { label: 'Technical Depth', value: result.analysis.scores.technicalDepth, color: '#a16207' },
            { label: 'Freshness', value: result.analysis.scores.freshness, color: '#059669' },
          ].map((stat) => (
            <Box key={stat.label} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 1.5, color: '#7c6f57', fontFamily: 'serif' }}>{stat.label}</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#222', fontFamily: 'serif' }}>{stat.value?.toFixed(1)}/10</Typography>
              </Box>
              <LinearProgress variant="determinate" value={stat.value * 10} sx={{ height: 10, borderRadius: 5, backgroundColor: '#f7e2a2', '& .MuiLinearProgress-bar': { backgroundColor: stat.color, borderRadius: 5 } }} />
            </Box>
          ))}
        </Box>
      </Box>

      {/* ...existing code for personas and TinyFishFindings... */}

      {/* Persona blocks above TinyFishFindings */}
      <div className="w-full max-w-4xl grid gap-8">
        <div className="relative">
          <PersonaBlock title="Ah Gong's Verdict" subtitle="Ah Gong: final family verdict">
            <PersonaMeta envelope={result.panel.ahGong} />
            {ahGong ? (
              <div className="grid gap-3">
                <p className="font-body text-xs uppercase tracking-[0.18em] text-ink/45">Verdict</p>
                <p className="font-display text-4xl text-cinnabar">{ahGong?.verdict}</p>
                <p className="font-body text-base leading-7 text-ink/78">{ahGong?.explanation}</p>
              </div>
            ) : null}
          </PersonaBlock>
          {/* PASS/FAIL badge */}
          {ahGong && (
            <div className="absolute top-4 right-6 z-10">
              {ahGong.verdict === 'Finalist' ? (
                <span className="inline-block rounded-full bg-jade/90 text-white font-bold px-4 py-1 shadow-lg border-2 border-jade text-lg">PASS</span>
              ) : (
                <span className="inline-block rounded-full bg-cinnabar/90 text-white font-bold px-4 py-1 shadow-lg border-2 border-cinnabar text-lg">FAIL</span>
              )}
            </div>
          )}
        </div>

        <PersonaBlock title="Korkor's Recommendations" subtitle="Korkor: older sibling who knows how to fix it">
          <PersonaMeta envelope={result.panel.korkorRecommendations} />
          {recommendations.length > 0 ? (
            <ul className="list-disc pl-5">
              {recommendations.map((rec, i) => (
                <li key={i} className="font-body text-base leading-7 text-ink/78">
                  <div><span className="font-semibold">Priority {rec.priority}:</span> {rec.issue}</div>
                  <div className="text-xs text-ink/60">Why it matters: {rec.whyItMatters}</div>
                  <div className="text-xs text-ink/60">Action: {rec.concreteAction}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-body text-base leading-7 text-ink/78">Korkor is still thinking...</p>
          )}
        </PersonaBlock>

        <PersonaBlock title="Refurbished by Korkor" subtitle="Korkor: what can be improved">
          <PersonaMeta envelope={result.panel.korkorRefurbished} />
          {refurbished ? (
            <div className="grid gap-3">
              <p className="font-body text-xs uppercase tracking-[0.18em] text-ink/45">Refurbished</p>
              <p className="font-display text-2xl text-jade">{refurbished?.title}</p>
              <p className="font-body text-base leading-7 text-ink/78">{refurbished?.content}</p>
              <p className="font-body text-xs text-ink/60">Reason: {refurbished?.reason}</p>
            </div>
          ) : (
            <p className="font-body text-base leading-7 text-ink/78">No refurbishments suggested.</p>
          )}
        </PersonaBlock>

        <TinyFishFindings analysis={result.analysis} warnings={result.tinyFish.warnings} />
      </div>
    </section>
  );
}
