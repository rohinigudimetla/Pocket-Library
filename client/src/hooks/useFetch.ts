import { useState, useEffect } from "react";

function useFetch(url: string) {
	const [data, setData] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		const controller = new AbortController();
		async function fetchData() {
			if (!url) {
				// setData(null);
				// setError("");
				// setIsLoading(false);
				return;
			}
			setError("");
			setData(null);
			setIsLoading(true);
			try {
				const response = await fetch(url, { signal: controller.signal });
				if (!response.ok) {
					throw new Error(`HTTP error: ${response.status}`);
				}
				const json = await response.json();

				setData(json);
			} catch (err: any) {
				if (err.name === "AbortError") return;
				setError("Something went wrong");
			} finally {
				setIsLoading(false);
			}
		}
		fetchData();
		return () => {
			controller.abort();
		};
	}, [url]);

	return { data, isLoading, error };
}

export default useFetch;
