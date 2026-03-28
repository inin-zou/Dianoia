package main

import (
	"log"
	"net/http"
	"os"

	"dianoia/internal/api"
	"dianoia/internal/gemini"
	"dianoia/internal/marble"
	"dianoia/internal/supabase"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env from project root (backend is at <root>/backend/)
	envPaths := []string{
		"../.env",       // when running from backend/
		"../../.env",    // fallback
		".env",          // local override
	}
	for _, p := range envPaths {
		if err := godotenv.Load(p); err == nil {
			log.Printf("Loaded env from %s", p)
			break
		}
	}

	// Initialize clients
	supabaseClient, err := supabase.NewClient()
	if err != nil {
		log.Fatalf("Failed to create Supabase client: %v", err)
	}
	log.Println("Supabase client initialized")

	geminiClient, err := gemini.NewClient()
	if err != nil {
		log.Printf("WARNING: Gemini client not initialized: %v (analysis endpoints will return 501)", err)
	} else {
		log.Println("Gemini client initialized")
	}

	marbleClient, err := marble.NewClient()
	if err != nil {
		log.Printf("WARNING: Marble client not initialized: %v (scan endpoints will return 501)", err)
	} else {
		log.Println("Marble client initialized")
	}

	// Create handlers
	casesHandler := api.NewCasesHandler(supabaseClient)
	evidenceHandler := api.NewEvidenceHandler(supabaseClient)
	witnessesHandler := api.NewWitnessesHandler(supabaseClient)
	analysisHandler := api.NewAnalysisHandler(supabaseClient, geminiClient)
	scanHandler := api.NewScanHandler(supabaseClient, marbleClient, geminiClient)
	profilesHandler := api.NewProfilesHandler(supabaseClient, geminiClient)

	// Set up router
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:4173"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Health check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","service":"dianoia-backend"}`))
	})

	// Mount API routes
	r.Route("/api", func(r chi.Router) {
		// Cases: all CRUD + sub-resources under one route group
		r.Route("/cases", func(r chi.Router) {
			r.Post("/", casesHandler.CreateCase)
			r.Get("/", casesHandler.ListCases)

			r.Route("/{id}", func(r chi.Router) {
				r.Get("/", casesHandler.GetCase)
				r.Put("/", casesHandler.UpdateCase)

				// Evidence
				r.Mount("/evidence", evidenceHandler.CaseRoutes())

				// Witnesses
				r.Mount("/witnesses", witnessesHandler.CaseRoutes())

				// Analysis
				r.Post("/analyze", analysisHandler.Analyze)
				r.Get("/hypotheses", analysisHandler.ListHypotheses)

				// Scan & Blueprint
				r.Post("/scan", scanHandler.StartScan)
				r.Get("/scan/status", scanHandler.ScanStatus)
				r.Post("/blueprint", scanHandler.GenerateBlueprint)

				// Profiles
				r.Mount("/profiles", profilesHandler.CaseRoutes())
			})
		})

		// Item-level routes (no case ID needed)
		r.Mount("/evidence", evidenceHandler.ItemRoutes())
		r.Mount("/witnesses", witnessesHandler.ItemRoutes())
		r.Mount("/hypotheses", analysisHandler.ItemRoutes())
		r.Mount("/profiles", profilesHandler.ItemRoutes())
	})

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("=== Dianoia Backend ===")
	log.Printf("Server starting on :%s", port)
	log.Printf("CORS allowed: localhost:5173, localhost:4173")
	log.Printf("API routes mounted at /api")
	log.Printf("Health check at /health")

	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
