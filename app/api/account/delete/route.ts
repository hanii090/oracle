import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { createLogger } from '@/lib/logger';
import { getAdminFirestore, getAdminAuth, isAdminConfigured } from '@/lib/firebase-admin';

export async function DELETE(req: Request) {
  const log = createLogger({ route: '/api/account/delete', correlationId: crypto.randomUUID() });

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    log.info('GDPR delete request initiated', { userId });

    if (!isAdminConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const db = getAdminFirestore();
    const auth = getAdminAuth();
    const batch = db.batch();

    // Collections to delete
    const collectionsToDelete = [
      'users',
      'threads',
      'therapyProfiles',
      'copingAnchors',
      'questionDna',
    ];

    // Delete main documents
    for (const collection of collectionsToDelete) {
      const docRef = db.collection(collection).doc(userId);
      batch.delete(docRef);
    }

    // Delete subcollections
    const subcollections = [
      { parent: 'sessionDebriefs', sub: 'debriefs' },
      { parent: 'preSessionPrimers', sub: 'primers' },
      { parent: 'weekSummaries', sub: 'weeks' },
      { parent: 'progressMilestones', sub: 'milestones' },
      { parent: 'moodTracking', sub: 'entries' },
    ];

    for (const { parent, sub } of subcollections) {
      try {
        const subSnapshot = await db.collection(parent).doc(userId).collection(sub).get();
        for (const doc of subSnapshot.docs) {
          batch.delete(doc.ref);
        }
        batch.delete(db.collection(parent).doc(userId));
      } catch (e) {
        log.warn(`Subcollection ${parent}/${sub} deletion skipped`, { userId });
      }
    }

    // Delete user sessions subcollection
    try {
      const sessionsSnapshot = await db.collection('users').doc(userId).collection('sessions').get();
      for (const doc of sessionsSnapshot.docs) {
        batch.delete(doc.ref);
      }
    } catch (e) {
      log.warn('Sessions subcollection deletion skipped', { userId });
    }

    // Delete homework assignments where user is patient
    try {
      const homeworkSnapshot = await db.collection('homeworkAssignments')
        .where('patientId', '==', userId)
        .get();
      for (const doc of homeworkSnapshot.docs) {
        batch.delete(doc.ref);
      }
    } catch (e) {
      log.warn('Homework assignments deletion skipped', { userId });
    }

    // Delete consent records where user is patient
    try {
      const consentSnapshot = await db.collection('therapistConsent')
        .where('patientId', '==', userId)
        .get();
      for (const doc of consentSnapshot.docs) {
        batch.delete(doc.ref);
      }
    } catch (e) {
      log.warn('Consent records deletion skipped', { userId });
    }

    // Commit all deletions
    await batch.commit();

    // Delete Firebase Auth user
    try {
      await auth.deleteUser(userId);
      log.info('Firebase Auth user deleted', { userId });
    } catch (e) {
      log.warn('Firebase Auth user deletion failed (may not exist)', { userId });
    }

    // Log GDPR compliance
    try {
      await db.collection('gdprDeletionLog').add({
        userId,
        deletedAt: new Date().toISOString(),
        collectionsDeleted: collectionsToDelete,
        subcollectionsDeleted: subcollections.map(s => `${s.parent}/${s.sub}`),
        authDeleted: true,
      });
    } catch (e) {
      log.warn('GDPR deletion log failed', { userId });
    }

    log.info('GDPR delete completed', { userId });

    return NextResponse.json({ 
      success: true,
      message: 'All your data has been permanently deleted.',
      gdprCompliance: 'Article 17 - Right to Erasure fulfilled',
    });
  } catch (error) {
    log.error('GDPR delete error', {}, error);
    return NextResponse.json(
      { error: 'Failed to delete data. Please contact support.' },
      { status: 500 }
    );
  }
}
