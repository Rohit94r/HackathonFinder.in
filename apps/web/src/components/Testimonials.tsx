'use client';

import React, { useState, useEffect } from 'react';
import { categories } from '@hackathonfinder/shared';

const illustrations = [
  'https://cdn.prod.website-files.com/635273ea37c256ef2835d522/654a36b6f78e92b5209148af_Kikin_Illustrations_Scene_01_RGB%202.svg',
  'https://cdn.prod.website-files.com/635273ea37c256ef2835d522/65363617f2f8b421dacfacc5_Illustration.svg',
  'https://cdn.prod.website-files.com/635273ea37c256ef2835d522/65366ae62f51f2c63edd236f_Scene-illustration-2.cropped.svg',
];

// One slide per content category the agents write for.
const slidesData = categories.map((category, i) => ({
  image: illustrations[i % illustrations.length],
  title: `${category.name}.`,
  quote: category.summary,
  label: `/${category.slug}`,
  example: `Example: ${category.example}`,
}));

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slidesData.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const current = slidesData[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slidesData.length) % slidesData.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slidesData.length);
  };

  return (
    <section className="section-testimonials-copy" style={{ position: 'relative' }}>
      <div className="container-24">
        <div className="testimonial-slider-3 w-slider">
          <div className="w-slider-mask">
            <div className="slide w-slide" style={{ display: 'block', opacity: 1 }}>
              <div className="testimonial-slide-wrap">
                <div className="w-layout-grid grid-two-column">
                  <div className="testimonials-h2-wrapper-mobile">
                    <h2 className="heading-h2-black-left">{current.title}</h2>
                  </div>
                  <img
                    alt=""
                    src={current.image}
                    loading="lazy"
                    className="testimonial-image"
                    style={{
                      borderRadius: '16px',
                      objectFit: 'cover',
                      maxHeight: '440px',
                      width: '100%',
                    }}
                  />
                  <div className="testimonial-slide-content">
                    <div className="testimonials-h2-wrapper">
                      <div className="h2-wrapper">
                        <h2 className="heading-h2-black-left">{current.title}</h2>
                      </div>
                    </div>
                    <div className="wrap-v-large">
                      <h6 className="testimonial-p">{current.quote}</h6>
                    </div>
                    <div className="wrap-v-x-small">
                      <div
                        className="paragraph-large text-weight-bold"
                        style={{ fontFamily: 'Deacon, sans-serif', color: '#39523c' }}
                      >
                        {current.label}
                      </div>
                      <div className="paragraph-small">{current.example}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Slider Controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              marginTop: '32px',
            }}
          >
            <button
              onClick={handlePrev}
              aria-label="Previous category"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: '#122315',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                transition: 'all 0.2s ease',
              }}
            >
              ←
            </button>

            <div style={{ display: 'flex', gap: '8px' }}>
              {slidesData.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  style={{
                    width: i === currentIndex ? '28px' : '10px',
                    height: '10px',
                    borderRadius: '5px',
                    background: i === currentIndex ? '#122315' : '#c4d7c7',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              aria-label="Next category"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: '#122315',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                transition: 'all 0.2s ease',
              }}
            >
              →
            </button>
          </div>
        </div>
      </div>

      <img
        src="https://cdn.prod.website-files.com/635273ea37c256ef2835d522/6552372d8825ecb49ccdda6b_priority-planet.svg"
        loading="lazy"
        alt=""
        className="image-25"
      />
      <img
        src="https://cdn.prod.website-files.com/635273ea37c256ef2835d522/6552372e1ab0c62b6f61a164_work-together.svg"
        loading="lazy"
        alt=""
        className="image-26"
      />
    </section>
  );
}
