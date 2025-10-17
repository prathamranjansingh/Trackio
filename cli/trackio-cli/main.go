package main

import (
	"bytes"
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

// Define exit codes to match the extension's expectations
const (
	ExitCodeOK            = 0   // Success
	ExitCodeGeneralError  = 1   // Generic error (e.g., reading stdin)
	ExitCodeNetworkOrAPI  = 102 // Specific code for network/API issues
	ExitCodeInvalidAPIKey = 104 // Specific code for auth issues (e.g., 401 Unauthorized)
)

func main() {
	// Define flags - ensure names match the extension's arguments
	apiKey := flag.String("key", "", "Your Code Tracker API key")
	apiUrl := flag.String("api-url", "", "The API endpoint URL to send heartbeats to")
	pluginInfo := flag.String("plugin", "", "The editor plugin version string (used for User-Agent)")
	flag.Parse() // Parse command-line arguments

	// --- Input Validation ---
	if *apiKey == "" {
		fmt.Fprintln(os.Stderr, "Error: API Key is required via --key flag.")
		os.Exit(ExitCodeInvalidAPIKey) // Use specific exit code
	}
	if *apiUrl == "" {
		fmt.Fprintln(os.Stderr, "Error: API URL is required via --api-url flag.")
		os.Exit(ExitCodeGeneralError) // Use general error for config issues
	}
	if *pluginInfo == "" {
		// Log a warning but don't exit, User-Agent might be optional for the API
		fmt.Fprintln(os.Stderr, "Warning: Plugin info is missing via --plugin flag. User-Agent header will be empty.")
	}

	// --- Read Data from Stdin ---
	// Read the JSON heartbeat batch piped from the VS Code extension
	body, err := io.ReadAll(os.Stdin)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error reading data from stdin: %v\n", err)
		os.Exit(ExitCodeGeneralError)
	}

	// If stdin is empty, there's nothing to send. Exit successfully.
	if len(body) == 0 {
		fmt.Println("No data received from stdin. Exiting.")
		os.Exit(ExitCodeOK)
	}

	// --- Send Data ---
	err = sendHeartbeats(body, *apiKey, *pluginInfo, *apiUrl)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error sending heartbeats: %v\n", err)
		// Check if the error indicates an API key issue
		if httpErr, ok := err.(*apiError); ok && httpErr.StatusCode == http.StatusUnauthorized {
			os.Exit(ExitCodeInvalidAPIKey)
		} else {
			os.Exit(ExitCodeNetworkOrAPI) // Use specific code for network/API fails
		}
	}

	fmt.Println("Heartbeats sent successfully.")
	os.Exit(ExitCodeOK)
}

// Custom error type to include status code
type apiError struct {
	StatusCode int
	Body       string
}

func (e *apiError) Error() string {
	return fmt.Sprintf("API error (status %d): %s", e.StatusCode, e.Body)
}

// sendHeartbeats constructs and sends the HTTP POST request
func sendHeartbeats(data []byte, apiKey, pluginUserAgent, apiUrl string) error {
	req, err := http.NewRequest("POST", apiUrl, bytes.NewBuffer(data))
	if err != nil {
		return fmt.Errorf("could not create HTTP request: %w", err)
	}

	// --- Set Headers ---
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Api-Key", apiKey)
	if pluginUserAgent != "" {
		req.Header.Set("User-Agent", pluginUserAgent)
	}

	// --- Make Request ---
	// Set a reasonable timeout for the HTTP request
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		// This usually indicates a network-level error (DNS, connection refused, etc.)
		return fmt.Errorf("HTTP request failed: %w", err)
	}
	defer resp.Body.Close() // Ensure the response body is closed

	// --- Handle Response ---
	// Check if the server responded with a non-success status code (>= 400)
	if resp.StatusCode >= 400 {
		respBody, readErr := io.ReadAll(resp.Body)
		bodyString := ""
		if readErr == nil {
			bodyString = string(respBody)
		} else {
			bodyString = fmt.Sprintf("(Could not read response body: %v)", readErr)
		}
		// Return our custom error type
		return &apiError{
			StatusCode: resp.StatusCode,
			Body:       bodyString,
		}
	}

	// Success (2xx status code)
	// Optionally read and discard the response body to allow connection reuse
	_, _ = io.Copy(io.Discard, resp.Body)

	return nil // No error
}
