import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import buildspaceLogo from '../assets/buildspace-logo.png';

const Home = () => {
  //Don't retry more than 20 times
  const maxRetries = 20;
  const [input, setInput] = useState('');
  const [img, setImg] = useState('');

  //Numbers of retries
  const [retry, setRetry] = useState(0);
  //Number of retries left
  const [retryCount, setRetryCount] = useState(maxRetries)
  //add isGenerating state
  const [isGenerating, setIsGenerating] = useState(false);
  const [finalPrompt, setFinalPrompt] = useState('');

  //add this function
  const onChange = (event) => {
    setInput(event.target.value);
  };

  const generateAction = async () => {
    console.log('Generating...');

    //add this check to make sure there is no double click
    if (isGenerating && retry === 0) return;

    //set loading has started
    setIsGenerating(true);

    //if this is retry request, take away retryCount
    if (retry > 0) {
      setRetryCount((prevState) => {
        if (prevState === 0) {
          return 0;
        } else {
          return prevState - 1;
        }
      });

      setRetry(0);
    }

    const finalInput = input.replace('nakale', 'nageshkale');

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'image/jpeg',
      },
      body: JSON.stringify({ input: finalInput }),
    });

    console.log(finalInput)

    const data = await response.json();

    //if model still loading, drop that retry time
    if (response.status == 503) {
      console.log('Model is loading still :(.')
      // Set the estimated_time property in state
      setRetry(data.estimated_time);
      return;
    }

    //if another error, drop error
    if (!response.ok) {
      console.log(`Error: ${data.error}`);
      //stop loading
      setIsGenerating(false);
      return;
    }

    //set final prompt
    setFinalPrompt(input);
    //remove content from input box
    setInput('');
    //set image data into state property
    setImg(data.image);
    //everything is all done -- stop loading.
    setIsGenerating(false);
  };

  const sleep = (ms) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  };

  //Add useEffect here
  useEffect(() => {
    const runRetry = async () => {
      if (retryCount === 0) {
        console.log(`Model still loading after ${maxRetries} retries. Try request again in 5 minutes.`);
        setRetryCount(maxRetries);
        return;
      }

      console.log(`Trying again in ${retry} seconds`);

      await sleep(retry * 1000);

      await generateAction();
    };

    if (retry === 0) {
      return;
    }

    runRetry();
  }, [retry]);

  return (
    <div className="root">
      <Head>
        <title>AI Avatar Generator | buildspace</title>
      </Head>
      <div className="container">
        <div className="header">
          <div className="header-title">
            <h1>Generate my Twin !!</h1>
          </div>
          <div className="header-subtitle">
            <h2>Turn me into anyone you want! Make sure you refer to me as "nagesh" in the prompt</h2>
          </div>
          <div className="prompt-container">
            <input className="prompt-box" value={input} onChange={onChange} placeholder='Enter prompt as "Oil painting of nagesh as God of War character, highly detailed, 4K"'></input>
            <div className='prompt-buttons'>
              <a 
                className={
                  isGenerating ? 'generate-button loading' : 'generate-button'
                }
                onClick={generateAction}>
                <div className='generate'>
                  {isGenerating ? (
                    <span className='loader'></span>
                  ) : (
                  <p>Create</p>
                  )}
                </div>
              </a>
            </div>
          </div>
        </div>
        {img && (
          <div className='output-content'>
            <Image src={img} width={512} height={512} alt={input} />
            <p>{finalPrompt}</p>
          </div>
        )}
      </div>
      {/* <div className="badge-container grow">
        <a
          href="https://buildspace.so/builds/ai-avatar"
          target="_blank"
          rel="noreferrer"
        >
          <div className="badge">
            <Image src={buildspaceLogo} alt="buildspace logo" />
            <p>build with buildspace</p>
          </div>
        </a>
      </div> */}
    </div>
  );
};

export default Home;
