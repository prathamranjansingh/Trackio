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

func main() {
	// Define flags to be passed from the extension
	apiKey := flag.String("key", "", "Your Code Tracker API key")
	pluginInfo := flag.String("plugin", "", "The editor plugin version string")
	apiUrl := flag.String("api-url", "", "The API endpoint to send heartbeats to")
	flag.Parse()

	// Exit if required flags are missing
	if *apiKey == "" {
		fmt.Fprintln(os.Stderr, "Error: API Key is required via --key flag.")
		os.Exit(104) // Error code for Invalid API Key
	}
	if *apiUrl == "" {
		fmt.Fprintln(os.Stderr, "Error: API URL is required via --api-url flag.")
		os.Exit(1)
	}

	// Read the JSON data (heartbeats) piped from the extension
	body, err := io.ReadAll(os.Stdin)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error reading from stdin: %v\n", err)
		os.Exit(1)
	}
	if len(body) == 0 {
		os.Exit(0) // Nothing to send, exit successfully
	}

	// Send the data to your backend
	if err := sendHeartbeats(body, *apiKey, *pluginInfo, *apiUrl); err != nil {
		fmt.Fprintf(os.Stderr, "Error sending heartbeats: %v\n", err)
		os.Exit(102) // Error code for Network/API issues
	}

	fmt.Println("Heartbeats sent successfully.")
}

// sendHeartbeats constructs and sends the HTTP POST request
func sendHeartbeats(data []byte, apiKey, plugin, apiUrl string) error {
	req, err := http.NewRequest("POST", apiUrl, bytes.NewBuffer(data))
	if err != nil {
		return fmt.Errorf("could not create request: %w", err)
	}

	// Set the required headers for your backend to process
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Api-Key", apiKey)
	req.Header.Set("User-Agent", plugin)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("http request failed: %w", err)
	}
	defer resp.Body.Close()

	// Check if the server responded with an error
	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("api error (status %d): %s", resp.StatusCode, string(body))
	}

	return nil
}
