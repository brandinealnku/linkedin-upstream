import express from "express";
import cors from "cors";
import linkedIn from "linkedin-jobs-api";

const app = express();
app.use(cors());
app.use(express.json());

// Health check (so you can test if server is running)
app.get("/", (req, res) => {
  res.json({ ok: true, message: "LinkedIn upstream is running" });
});

// Main endpoint your Cloudflare Worker will call
app.get("/api/linkedin", async (req, res) => {
  try {
    const q = req.query;

    const queryOptions = {
      keyword: q.keyword || "artificial intelligence",
      location: q.location || "United States",
      dateSincePosted: q.dateSincePosted || "past week",
      jobType: q.jobType || "",
      remoteFilter: q.remoteFilter || "",
      salary: q.salary || "",
      experienceLevel: q.experienceLevel || "",
      sortBy: q.sortBy || "recent",
      limit: q.limit || "25",
      page: q.page || "0",
      has_verification: q.has_verification === "true",
      under_10_applicants: q.under_10_applicants === "true"
    };

    const jobs = await linkedIn.query(queryOptions);

    // Normalize output so it matches your dashboard pattern
    const normalized = (jobs || []).map((j) => ({
      source: "linkedin",
      title: j.position || "",
      company: j.company || "",
      location: j.location || "",
      postedAt: j.date || j.agoTime || "",
      salary: j.salary || "",
      url: j.jobUrl || "",
      companyLogo: j.companyLogo || ""
    }));

    res.json({
      ok: true,
      query: queryOptions,
      totalRaw: normalized.length,
      jobs: normalized
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Listening on port", PORT));
