import styled from 'styled-components'

const Anim = styled.div`
	opacity: 0;
	animation: fade 0.4s ease-in forwards;

	@keyframes fade {
		0% {
			opacity: 0.4;
		}
		50% {
			opacity: 0.8;
		}
		100% {
			opacity: 1;
		}
	}
`;

function Loading() {
	return (
		<Anim>
			<div className={`p-16 opacity-0 animate-fade w-screen h-screen flex justify-center items-center`}>
				<svg className={`animate-spin -ml-1 mr-3 h-5 w-5 text-black`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
					<circle className={`opacity-25`} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
					<path className={`opacity-75`} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
				welcome back! | fetching data...
				
				<br />
				did you know that cows have a field of vision of 330 degrees!?!?
			</div>
		</Anim>
	)
}

export default Loading