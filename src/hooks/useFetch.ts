import { useState, useEffect } from "react";

function useFetch(url: string) {
	const [data, setData] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		async function fetchData() {
			try {
				const response = await fetch(url);
				const json = await response.json();
				setData(json);
			} catch (err) {
				setError("Something went wrong");
			} finally {
				setIsLoading(false);
			}
		}
		fetchData();
	}, [url]);

	return { data, isLoading, error };
}

export default useFetch;
