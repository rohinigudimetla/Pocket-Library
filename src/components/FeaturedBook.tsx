import useFetch from "../hooks/useFetch";

function FeaturedBook() {
	const { data, isLoading, error } = useFetch(
		"https://openlibrary.org/works/OL45804W.json",
	);

	if (isLoading) return <div>Loading...</div>;
	if (error) return <div>{error}</div>;

	return (
		<div>
			<h3>Featured Book</h3>
			<p>{data?.title}</p>
			<p>Author info requires second fetch</p>
		</div>
	);
}
export default FeaturedBook;
