import React, { useMemo, useState } from "react";
import { UploadCloud, Loader2, CheckCircle2, Wand2, ChevronRight, ChevronLeft, Globe2, Music2, Image as ImageIcon, Settings2, Send, Eye } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";

const GENRES = ["Afrobeats", "Afropop", "Amapiano", "Afrohouse", "Highlife", "Fuji", "Juju", "R&B", "Hip-Hop", "Gospel", "Pop", "Alternative", "Jazz", "Soul"];
const STORES = ["Spotify", "Apple Music", "YouTube Music", "Audiomack", "Boomplay", "Amazon Music", "Deezer", "Tidal", "TikTok Music", "Instagram/Facebook Music"];

const STEPS = [
  { number: 1, label: "TRACK UPLOAD", icon: Music2 },
  { number: 2, label: "ALBUM ART", icon: ImageIcon },
  { number: 3, label: "DISTRIBUTION PREFERENCES", icon: Settings2 },
  { number: 4, label: "PREVIEW/DISTRIBUTE", icon: Send },
];

export default function UploadMusicForm({ onCreated }) {
  const [form, setForm] = useState({
    title: "",
    artist: "",
    featured_artist: "",
    genre: "",
    language: "English",
    release_date: "",
    lyrics: "",
    type: "single",
  });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [artworkFile, setArtworkFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [step, setStep] = useState(1);
  const [stores, setStores] = useState(STORES);
  const [territory, setTerritory] = useState("worldwide");
  const [explicit, setExplicit] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const { toast } = useToast();

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const toggleStore = (store) => {
    setStores((prev) => prev.includes(store) ? prev.filter((item) => item !== store) : [...prev, store]);
  };

  const suggestMetadata = async () => {
    if (!form.title) {
      toast({ title: "Enter a title first", description: "We need the song title to generate metadata.", variant: "destructive" });
      return;
    }
    setAiLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate music metadata for a song titled "${form.title}"${form.artist ? ` by ${form.artist}` : ""}${form.genre ? ` in the ${form.genre} genre` : ""}. Return ONLY JSON with genre, language, mood, tags and description.`,
        response_json_schema: {
          type: "object",
          properties: {
            genre: { type: "string" },
            language: { type: "string" },
            mood: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
            description: { type: "string" },
          },
        },
      });
      if (res?.genre) {
        setForm((prev) => ({ ...prev, genre: res.genre || prev.genre, language: res.language || prev.language }));
        toast({ title: "✨ AI suggestions applied", description: `${res.genre}${res.mood ? ` · ${res.mood}` : ""}` });
      }
    } catch {
      toast({ title: "AI suggestion unavailable", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  const canContinue = useMemo(() => {
    if (step === 1) return Boolean(form.title && form.artist && audioFile);
    if (step === 2) return Boolean(artworkFile);
    if (step === 3) return stores.length > 0;
    return accepted;
  }, [step, form.title, form.artist, audioFile, artworkFile, stores, accepted]);

  const next = () => {
    if (step === 1 && (!form.title || !form.artist)) {
      toast({ title: "Missing required information", description: "Song title and artist name are required.", variant: "destructive" });
      return;
    }
    if (step === 1 && !audioFile) {
      toast({ title: "Upload the track", description: "Please upload the master audio before continuing.", variant: "destructive" });
      return;
    }
    if (step === 2 && !artworkFile) {
      toast({ title: "Album art required", description: "Please upload the release artwork before continuing.", variant: "destructive" });
      return;
    }
    if (step === 3 && stores.length === 0) {
      toast({ title: "Choose at least one store", variant: "destructive" });
      return;
    }
    setStep((current) => Math.min(4, current + 1));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!accepted) {
      toast({ title: "Confirm your release", description: "Please confirm that the information and rights are correct.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await base44.entities.Release.create({
        title: form.title,
        artist: form.artist,
        featured_artist: form.featured_artist,
        genre: form.genre,
        language: form.language,
        type: form.type,
        release_date: form.release_date,
        status: "in_review",
        territories: [territory],
        platforms: stores,
        metadata_valid: true,
        distribution_unlocked: true,
        content_id_status: "not_enrolled",
      });
      setDone(true);
      onCreated?.();
      toast({ title: "🎉 Release submitted", description: "Your release is now in review for distribution." });
      setTimeout(() => {
        setDone(false);
        setStep(1);
        setForm({ title: "", artist: "", featured_artist: "", genre: "", language: "English", release_date: "", lyrics: "", type: "single" });
        setArtworkFile(null);
        setAudioFile(null);
        setAccepted(false);
      }, 2500);
    } catch {
      toast({ title: "Submission failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-4 sm:px-6 pt-5 pb-2 border-b border-border overflow-x-auto">
          <div className="min-w-[720px] grid grid-cols-4 gap-2">
            {STEPS.map(({ number, label, icon: Icon }) => {
              const active = step === number;
              const completed = step > number;
              return (
                <button
                  key={number}
                  type="button"
                  disabled={number > step}
                  onClick={() => number < step && setStep(number)}
                  className={`relative pb-4 text-left transition-colors ${active ? "text-primary" : completed ? "text-primary/80" : "text-muted-foreground"}`}
                >
                  <div className="flex items-center gap-2 text-[11px] sm:text-xs font-semibold tracking-wide whitespace-nowrap">
                    <span className={`w-7 h-7 rounded-full grid place-items-center border ${active ? "border-primary bg-primary text-primary-foreground" : completed ? "border-primary bg-primary/10" : "border-border"}`}>
                      {completed ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                    </span>
                    <span>{label}</span>
                  </div>
                  {active && <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-primary" />}
                  {completed && !active && <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-primary/30" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-5 sm:p-7">
          {step === 1 && (
            <motion.div key="track" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">Track Upload</h3>
                  <p className="text-sm text-muted-foreground">Add the release metadata and master audio.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={suggestMetadata} disabled={aiLoading} className="gap-2">
                  {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 text-primary" />}
                  AI Suggest
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5"><Label>Release type</Label><select value={form.type} onChange={set("type")} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="single">Single</option><option value="ep">EP</option><option value="album">Album</option></select></div>
                <div className="space-y-1.5"><Label>Song / Release title *</Label><Input value={form.title} onChange={set("title")} placeholder="Enter title" /></div>
                <div className="space-y-1.5"><Label>Primary artist *</Label><Input value={form.artist} onChange={set("artist")} placeholder="Artist name" /></div>
                <div className="space-y-1.5"><Label>Featured artist</Label><Input value={form.featured_artist} onChange={set("featured_artist")} placeholder="Optional" /></div>
                <div className="space-y-1.5"><Label>Genre</Label><select value={form.genre} onChange={set("genre")} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Select genre…</option>{GENRES.map((genre) => <option key={genre} value={genre}>{genre}</option>)}</select></div>
                <div className="space-y-1.5"><Label>Language</Label><Input value={form.language} onChange={set("language")} placeholder="English" /></div>
                <div className="space-y-1.5"><Label>Release date</Label><Input type="date" value={form.release_date} onChange={set("release_date")} /></div>
              </div>

              <div className="space-y-1.5"><Label>Lyrics</Label><Textarea rows={4} value={form.lyrics} onChange={set("lyrics")} placeholder="Paste lyrics here…" /></div>

              <label className={`border-2 border-dashed rounded-xl p-7 cursor-pointer flex flex-col items-center justify-center text-center gap-2 transition-colors ${audioFile ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                <input type="file" accept=".wav,.flac,.aiff,.mp3" className="hidden" onChange={(event) => setAudioFile(event.target.files?.[0] || null)} />
                <UploadCloud className={`w-9 h-9 ${audioFile ? "text-primary" : "text-muted-foreground"}`} />
                <span className="font-semibold">{audioFile ? audioFile.name : "Upload track"}</span>
                <span className="text-xs text-muted-foreground">WAV, FLAC, AIFF or MP3 · use your final master</span>
              </label>

              <div className="flex justify-end"><Button type="button" onClick={next} className="gap-2">Continue to Album Art <ChevronRight className="w-4 h-4" /></Button></div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="art" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div><h3 className="text-lg font-semibold">Album Art</h3><p className="text-sm text-muted-foreground">Upload the artwork that will represent this release across stores.</p></div>
              <label className={`border-2 border-dashed rounded-2xl p-10 cursor-pointer flex flex-col items-center justify-center text-center gap-3 transition-colors ${artworkFile ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={(event) => setArtworkFile(event.target.files?.[0] || null)} />
                <ImageIcon className={`w-12 h-12 ${artworkFile ? "text-primary" : "text-muted-foreground"}`} />
                <span className="font-semibold text-lg">{artworkFile ? artworkFile.name : "Upload album artwork"}</span>
                <span className="text-sm text-muted-foreground">JPG or PNG · 3000 × 3000 recommended · RGB</span>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-muted/50 p-4 text-sm"><p className="font-medium">Artwork checklist</p><p className="text-muted-foreground mt-1">Original artwork, clear title and artist name, no platform logos or advertisements.</p></div>
                <div className="rounded-xl bg-muted/50 p-4 text-sm"><p className="font-medium">Release</p><p className="text-muted-foreground mt-1">{form.title || "Untitled"} · {form.artist || "Artist"}</p></div>
              </div>
              <div className="flex justify-between gap-3"><Button type="button" variant="outline" onClick={() => setStep(1)} className="gap-2"><ChevronLeft className="w-4 h-4" /> Back</Button><Button type="button" onClick={next} className="gap-2">Continue to Distribution Preferences <ChevronRight className="w-4 h-4" /></Button></div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="preferences" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div><h3 className="text-lg font-semibold">Distribution Preferences</h3><p className="text-sm text-muted-foreground">Choose where and when Xedruo should distribute your release.</p></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5"><Label>Territory</Label><select value={territory} onChange={(event) => setTerritory(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="worldwide">Worldwide</option><option value="selected">Selected territories</option></select></div>
                <div className="space-y-1.5"><Label>Release date</Label><Input type="date" value={form.release_date} onChange={set("release_date")} /></div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3"><div><p className="font-medium">Digital stores</p><p className="text-xs text-muted-foreground">Select the stores that should receive this release.</p></div><Button type="button" variant="ghost" size="sm" onClick={() => setStores(stores.length === STORES.length ? [] : STORES)}>Select all</Button></div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {STORES.map((store) => <label key={store} className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 cursor-pointer hover:border-primary/50"><input type="checkbox" checked={stores.includes(store)} onChange={() => toggleStore(store)} className="h-4 w-4 accent-current" /><span className="text-sm">{store}</span></label>)}
                </div>
              </div>
              <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={explicit} onChange={(event) => setExplicit(event.target.checked)} className="h-4 w-4 accent-current" />This release contains explicit content</label>
              <div className="rounded-xl border border-border bg-muted/40 p-4 flex gap-3"><Globe2 className="w-5 h-5 text-primary mt-0.5" /><div><p className="font-medium">Xedruo distribution review</p><p className="text-sm text-muted-foreground mt-1">Xedruo will check metadata, audio and artwork before sending the release to the selected stores.</p></div></div>
              <div className="flex justify-between gap-3"><Button type="button" variant="outline" onClick={() => setStep(2)} className="gap-2"><ChevronLeft className="w-4 h-4" /> Back</Button><Button type="button" onClick={next} className="gap-2">Preview / Distribute <ChevronRight className="w-4 h-4" /></Button></div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="preview" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-primary/10 grid place-items-center"><Eye className="w-5 h-5 text-primary" /></div><div><h3 className="text-lg font-semibold">Preview / Distribute</h3><p className="text-sm text-muted-foreground">Review the complete release before sending it to distribution.</p></div></div>
              <div className="grid gap-5 md:grid-cols-[180px_1fr]">
                <div className="aspect-square rounded-2xl border border-border bg-muted overflow-hidden grid place-items-center">{artworkFile ? <img src={URL.createObjectURL(artworkFile)} alt="Release artwork preview" className="w-full h-full object-cover" /> : <ImageIcon className="w-10 h-10 text-muted-foreground" />}</div>
                <div className="space-y-4">
                  <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Release</p><h4 className="text-2xl font-bold">{form.title || "Untitled"}</h4><p className="text-muted-foreground">{form.artist}{form.featured_artist ? ` feat. ${form.featured_artist}` : ""}</p></div>
                  <div className="grid gap-3 sm:grid-cols-2 text-sm"><div className="rounded-xl bg-muted/50 p-3"><span className="text-muted-foreground">Type</span><p className="font-medium capitalize">{form.type}</p></div><div className="rounded-xl bg-muted/50 p-3"><span className="text-muted-foreground">Genre</span><p className="font-medium">{form.genre || "Not set"}</p></div><div className="rounded-xl bg-muted/50 p-3"><span className="text-muted-foreground">Release date</span><p className="font-medium">{form.release_date || "Not scheduled"}</p></div><div className="rounded-xl bg-muted/50 p-3"><span className="text-muted-foreground">Territory</span><p className="font-medium capitalize">{territory}</p></div></div>
                </div>
              </div>
              <div className="rounded-xl border border-border p-4"><div className="flex items-center justify-between mb-2"><p className="font-medium">Distribution stores</p><span className="text-xs text-muted-foreground">{stores.length} selected</span></div><div className="flex flex-wrap gap-2">{stores.map((store) => <span key={store} className="rounded-full bg-primary/10 text-primary px-3 py-1 text-xs">{store}</span>)}</div></div>
              <label className="flex items-start gap-3 rounded-xl border border-border p-4 cursor-pointer"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="h-4 w-4 mt-0.5 accent-current" /><span className="text-sm">I confirm that the metadata, audio, artwork and distribution rights are correct and that I am authorized to distribute this release.</span></label>
              <div className="flex justify-between gap-3"><Button type="button" variant="outline" onClick={() => setStep(3)} className="gap-2"><ChevronLeft className="w-4 h-4" /> Back</Button><Button type="submit" disabled={saving || !accepted} className="gap-2">{saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : done ? <><CheckCircle2 className="w-4 h-4" /> Distributed</> : <><Send className="w-4 h-4" /> Submit for Distribution</>}</Button></div>
            </motion.div>
          )}
        </div>
      </div>
    </form>
  );
}
