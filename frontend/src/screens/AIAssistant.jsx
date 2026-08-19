import React, { useState } from "react";
import { Sparkles, Loader2, Copy, CheckCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/app/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AIPlanGate from "@/components/ai/AIPlanGate";
import VoiceSampleTool from "@/components/ai/VoiceSampleTool";

const TOOLS = [
  { id: "lyrics", label: "Lyrics Generator", icon: "🎵", fields: [["Song Theme / Title", "theme"], ["Genre", "genre"], ["Mood", "mood"], ["Language", "language"]], prompt: (f) => `Write original song lyrics for a song called "${f.theme}" in the ${f.genre || "Afrobeats"} genre with a ${f.mood || "uplifting"} mood in ${f.language || "English"}. Include verse 1, pre-chorus, chorus, verse 2, bridge.` },
  { id: "metadata", label: "Metadata Generator", icon: "🏷️", fields: [["Song Title", "title"], ["Artist Name", "artist"], ["Genre", "genre"]], prompt: (f) => `Generate optimized music metadata for a song titled "${f.title}" by ${f.artist} in the ${f.genre} genre. Include: genre tags, mood tags, sub-genre, tempo (BPM), key, language, description, keywords.` },
  { id: "description", label: "Song Description", icon: "📝", fields: [["Song Title", "title"], ["Artist", "artist"], ["Genre", "genre"], ["Vibe", "vibe"]], prompt: (f) => `Write a compelling, SEO-optimized song description for "${f.title}" by ${f.artist}. Genre: ${f.genre}. Vibe: ${f.vibe}. Include a YouTube description, Spotify bio section, and press release blurb.` },
  { id: "marketing", label: "Marketing Plan", icon: "📣", fields: [["Song/Project Title", "title"], ["Target Audience", "audience"], ["Budget (₦)", "budget"]], prompt: (f) => `Create a detailed music marketing plan for "${f.title}" targeting ${f.audience}. Budget: ₦${f.budget}. Include social media strategy, DSP pitching, playlist strategy, press outreach, influencer strategy, and a week-by-week content calendar.` },
  { id: "caption", label: "Social Captions", icon: "📲", fields: [["Song/Project", "title"], ["Platform", "platform"], ["Vibe", "vibe"]], prompt: (f) => `Write 5 engaging ${f.platform || "Instagram"} captions to promote "${f.title}". Vibe: ${f.vibe || "uplifting"}. Include hashtags, emojis, call-to-action.` },
  { id: "release_plan", label: "Release Planner", icon: "📅", fields: [["Artist", "artist"], ["Release Title", "title"], ["Release Date", "date"], ["Genre", "genre"]], prompt: (f) => `Create a 4-week music release plan for "${f.title}" by ${f.artist} releasing on ${f.date}. Genre: ${f.genre}. Include: pre-release tasks, release-day strategy, post-release follow-up, playlist pitching, social content schedule.` },
  { id: "seo", label: "SEO Optimizer", icon: "🔍", fields: [["Artist/Brand Name", "name"], ["Genre", "genre"], ["Main Markets", "markets"]], prompt: (f) => `Generate an SEO optimization strategy for ${f.name}, a ${f.genre} artist/brand targeting ${f.markets}. Include: artist bio SEO, YouTube SEO, DSP profile optimization, website meta tags, keywords, Google presence tips.` },
  { id: "insights", label: "Analytics Insights", icon: "📊", fields: [["Streams (monthly)", "streams"], ["Top Country", "country"], ["Top Platform", "platform"], ["Genre", "genre"]], prompt: (f) => `Analyze these music analytics and give detailed insights: ${f.streams} monthly streams, top country: ${f.country}, top platform: ${f.platform}, genre: ${f.genre}. Provide: audience breakdown, growth recommendations, content strategy, DSP focus areas.` },
];

function ToolPanel({ tool, onConsume }) {
  const [form, setForm] = useState({});
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const run = async () => {
    setLoading(true); setResult("");
    try {
      const response = await base44.ai.orchestrate({ role: "creative", company: "xedruo-ai", task: tool.prompt(form), outputFormat: "text" });
      setResult(response.text || "No AI output was returned.");
      onConsume?.();
    } catch (error) {
      setResult(`AI request failed: ${error.message}`);
    } finally { setLoading(false); }
  };

  const copy = () => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{tool.icon}</span>
          <h3 className="font-semibold">{tool.label}</h3>
        </div>
        {tool.fields.map(([label, key]) => (
          <div key={key} className="space-y-1.5">
            <Label>{label}</Label>
            <Input value={form[key] || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
          </div>
        ))}
        <Button className="w-full" onClick={run} disabled={loading}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating…</> : <><Sparkles className="w-4 h-4 mr-2" />Generate</>}
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-muted-foreground">Output</h3>
          {result && <Button variant="ghost" size="sm" onClick={copy}>{copied ? <><CheckCheck className="w-4 h-4 mr-1" />Copied</> : <><Copy className="w-4 h-4 mr-1" />Copy</>}</Button>}
        </div>
        {loading && <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}
        {!loading && !result && <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Fill in the form and click Generate to see results here.</div>}
        {!loading && result && <Textarea value={result} readOnly className="flex-1 min-h-64 resize-none text-sm bg-muted/50" />}
      </div>
    </div>
  );
}

export default function AIAssistant() {
  return (
    <div>
      <PageHeader title="Xedruo AI" subtitle="AI-powered tools for creators, powered by the Xedruo AI routing layer." />
      <AIPlanGate>
        <GatedContent />
      </AIPlanGate>
    </div>
  );
}

function GatedContent({ onConsume }) {
  return (
    <Tabs defaultValue="lyrics">
      <TabsList className="mb-6 flex-wrap h-auto gap-1">
        {TOOLS.map(t => <TabsTrigger key={t.id} value={t.id}>{t.icon} {t.label}</TabsTrigger>)}
        <TabsTrigger value="voice">🎙️ Voice Sample</TabsTrigger>
      </TabsList>
      {TOOLS.map(t => (
        <TabsContent key={t.id} value={t.id}>
          <ToolPanel tool={t} onConsume={onConsume} />
        </TabsContent>
      ))}
      <TabsContent value="voice">
        <VoiceSampleTool onConsume={onConsume} />
      </TabsContent>
    </Tabs>
  );
}
