'use client';

import React, { useState, useEffect } from 'react';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('hf_cookie_consent');
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('hf_cookie_consent', 'accepted_all');
    setVisible(false);
    setShowPreferences(false);
  };

  const handleSaveSettings = () => {
    localStorage.setItem(
      'hf_cookie_consent',
      JSON.stringify({ necessary: true, analytics })
    );
    setVisible(false);
    setShowPreferences(false);
  };

  const handleClose = () => {
    setVisible(false);
    setShowPreferences(false);
  };

  if (!visible) return null;

  return (
    <>
      <div
        fs-cc="banner"
        className="cookie-popup_component"
        style={{
          display: visible ? 'block' : 'none',
          position: 'fixed',
          bottom: '24px',
          left: '24px',
          zIndex: 9999,
          maxWidth: '420px',
        }}
      >
        <div className="cookie-modal_component is-small">
          <button
            onClick={handleClose}
            className="cookie-modal_closebutton w-inline-block"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <div className="cookie-modal_closebutton_line is-left"></div>
            <div className="cookie-modal_closebutton_line is-right"></div>
            <span className="screenreader-only">Close Cookie Popup</span>
          </button>
          <div className="cookie-modal_content-wrap is-small">
            <div className="cookie-modal_title is-small">We use cookies</div>
            <div className="cookie-modal_description">
              We use a few cookies to keep the site working and, with your OK, to see which
              pages are useful.
            </div>
          </div>
          <div className="cookie-modal_button-wrap is-small">
            <button
              onClick={() => setShowPreferences(true)}
              className="cookie-modal_button is-secondary w-inline-block"
              style={{ background: 'transparent', cursor: 'pointer' }}
            >
              <div className="cookie-modal_button_text-ghost">Cookie Settings</div>
            </button>
            <button
              onClick={handleAcceptAll}
              className="cookie-modal_button w-inline-block"
              style={{ cursor: 'pointer' }}
            >
              <div className="cookie-modal_button_text">Accept All Cookies</div>
            </button>
          </div>
        </div>
      </div>

      {showPreferences && (
        <div
          fs-cc="preferences"
          className="cookie-preference_component"
          style={{ display: 'flex', zIndex: 10000, position: 'fixed', inset: 0 }}
        >
          <div
            onClick={handleClose}
            className="cookie-preference_background"
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)' }}
          ></div>
          <div className="cookie-preference_wrapper" style={{ margin: 'auto', zIndex: 10001 }}>
            <div className="cookie-modal_component">
              <button
                onClick={handleClose}
                className="cookie-modal_closebutton is-sticky w-inline-block"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <div className="cookie-modal_closebutton_line is-left"></div>
                <div className="cookie-modal_closebutton_line is-right"></div>
                <span className="screenreader-only">Close Cookie Preference Manager</span>
              </button>
              <div className="cookie-modal_content-wrap">
                <div className="cookie-modal_title">Cookie Settings</div>
                <div className="cookie-modal_description">
                  Choose which cookies HackathonFinder can use. Necessary cookies are always on
                  because the site needs them. Analytics cookies are optional.
                </div>
                <div className="cookie-modal_form-wrap w-form">
                  <div className="cookie-modal_form">
                    <div className="cookie-modal_radio is--not-allowed w-clearfix">
                      <div className="cookie-modal_radio_button is-always-active"></div>
                      <div className="cookie-modal_radio_label is--not-allowed">
                        Strictly Necessary (Always Active)
                      </div>
                      <div className="cookie-modal_radio_description is--not-allowed">
                        Needed for the site to load, remember your choices and stay secure.
                      </div>
                    </div>

                    <label
                      className="w-checkbox cookie-modal_radio w-clearfix"
                      style={{ cursor: 'pointer' }}
                    >
                      <input
                        type="checkbox"
                        checked={analytics}
                        onChange={(e) => setAnalytics(e.target.checked)}
                        style={{ marginRight: '8px' }}
                      />
                      <span className="cookie-modal_radio_label w-form-label">Analytics</span>
                      <div className="cookie-modal_radio_description">
                        Help us see which pages are read and where the site has problems, so we
                        can improve it.
                      </div>
                    </label>

                    <div className="cookie-modal_button-wrap in-pref-manger">
                      <button
                        onClick={handleAcceptAll}
                        className="cookie-modal_button w-inline-block"
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="cookie-modal_button_text">Accept All Cookies</div>
                      </button>
                      <button
                        onClick={handleSaveSettings}
                        className="cookie-modal_button is-secondary w-inline-block"
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="cookie-modal_button_text-ghost">Save Settings</div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
