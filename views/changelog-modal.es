import React from 'react'
import PropTypes from 'prop-types'
import { Button, Label, Modal } from 'react-bootstrap'

const { __ } = window.i18n['poi-plugin-item-improvement2']

export const ChangelogModal = ({ entries, onHide, show }) => (
  <Modal show={show} onHide={onHide} bsSize="large">
    <Modal.Header closeButton>
      <Modal.Title>{__('Release Notes')}</Modal.Title>
    </Modal.Header>
    <Modal.Body className="improvement-changelog">
      {
        entries.map(entry => (
          <section className="improvement-changelog-version" key={entry.version}>
            <h4><Label bsStyle="info">v{entry.version}</Label></h4>
            <ul>
              {entry.items.map(item => <li key={item}>{__(item)}</li>)}
            </ul>
          </section>
        ))
      }
    </Modal.Body>
    <Modal.Footer>
      <Button bsStyle="primary" onClick={onHide}>{__('Close')}</Button>
    </Modal.Footer>
  </Modal>
)

ChangelogModal.propTypes = {
  entries: PropTypes.arrayOf(PropTypes.shape({
    version: PropTypes.string.isRequired,
    items: PropTypes.arrayOf(PropTypes.string).isRequired,
  })).isRequired,
  onHide: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired,
}
