//! Active-time scheduling; no Windows dependencies so boundary tests run quickly.
#[derive(Default)]
pub struct ReminderClock {
    elapsed: [f64; 3],
    intervals: [f64; 3],
    snooze: [Option<f64>; 3],
    cooldown: f64,
}
impl ReminderClock {
    pub fn tick(
        &mut self,
        seconds: f64,
        intervals: [f64; 3],
        eligible: bool,
        available: bool,
    ) -> Option<usize> {
        for (i, interval) in intervals.iter().enumerate() {
            if self.intervals[i] != *interval {
                self.elapsed[i] = 0.;
                self.snooze[i] = None;
            }
        }
        self.intervals = intervals;
        if !eligible {
            return None;
        }
        // Never count a suspended process or an overnight timer jump as active time.
        let dt = seconds.clamp(0., 2.);
        self.cooldown = (self.cooldown - dt).max(0.);
        for (i, interval) in intervals.iter().enumerate() {
            if *interval > 0. {
                self.elapsed[i] += dt;
                if let Some(remaining) = &mut self.snooze[i] {
                    *remaining -= dt;
                }
            }
        }
        if !available {
            return None;
        }
        // A five-minute snooze has its own deadline, independent of card spacing.
        let snoozed = (0..3)
            .filter(|&i| intervals[i] > 0. && self.snooze[i].is_some_and(|n| n <= 0.))
            .min_by(|&a, &b| self.snooze[a].unwrap().total_cmp(&self.snooze[b].unwrap()));
        let due = snoozed.or_else(|| {
            if self.cooldown > 0. {
                return None;
            }
            // Serve the most overdue card first rather than always preferring water.
            (0..3)
                .filter(|&i| {
                    intervals[i] > 0. && self.snooze[i].is_none() && self.elapsed[i] >= intervals[i]
                })
                .max_by(|&a, &b| {
                    (self.elapsed[a] - intervals[a])
                        .total_cmp(&(self.elapsed[b] - intervals[b]))
                        .then_with(|| b.cmp(&a))
                })
        })?;
        self.respond(due, false);
        self.cooldown = 300.;
        Some(due)
    }
    pub fn respond(&mut self, kind: usize, snooze: bool) {
        self.elapsed[kind] = 0.;
        self.snooze[kind] = snooze.then_some(300.);
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    fn advance(
        c: &mut ReminderClock,
        seconds: usize,
        intervals: [f64; 3],
        eligible: bool,
    ) -> Vec<usize> {
        (0..seconds)
            .filter_map(|_| c.tick(1., intervals, eligible, true))
            .collect()
    }
    #[test]
    fn counts_active_time_only_and_ignores_resume_jumps() {
        let mut c = ReminderClock::default();
        assert!(advance(&mut c, 500, [10., 0., 0.], false).is_empty());
        assert!(c.tick(36000., [10., 0., 0.], true, true).is_none());
        assert_eq!(advance(&mut c, 8, [10., 0., 0.], true), vec![0]);
    }
    #[test]
    fn snooze_waits_five_active_minutes() {
        let mut c = ReminderClock::default();
        assert_eq!(advance(&mut c, 10, [10., 0., 0.], true), vec![0]);
        c.respond(0, true);
        assert!(advance(&mut c, 299, [10., 0., 0.], true).is_empty());
        assert_eq!(c.tick(1., [10., 0., 0.], true, true), Some(0));
    }
    #[test]
    fn simultaneous_reminders_are_spaced_and_disabled_ones_cancel() {
        let mut c = ReminderClock::default();
        assert_eq!(advance(&mut c, 10, [10., 10., 0.], true), vec![0]);
        assert!(advance(&mut c, 299, [0., 10., 0.], true).is_empty());
        assert_eq!(c.tick(1., [0., 10., 0.], true, true), Some(1));
        assert!(advance(&mut c, 1000, [0., 0., 0.], true).is_empty());
    }
    #[test]
    fn interval_changes_start_a_fresh_timer() {
        let mut c = ReminderClock::default();
        advance(&mut c, 9, [10., 0., 0.], true);
        assert!(advance(&mut c, 19, [20., 0., 0.], true).is_empty());
        assert_eq!(c.tick(1., [20., 0., 0.], true, true), Some(0));
    }
    #[test]
    fn visible_cards_and_previews_do_not_pause_other_timers() {
        let mut c = ReminderClock::default();
        for _ in 0..600 {
            assert_eq!(c.tick(1., [600., 0., 0.], true, false), None);
        }
        assert_eq!(c.tick(0., [600., 0., 0.], true, true), Some(0));
    }
    #[test]
    fn snooze_deadline_is_not_delayed_by_another_reminder() {
        let mut c = ReminderClock::default();
        advance(&mut c, 600, [600., 910., 0.], true);
        advance(&mut c, 30, [600., 910., 0.], true);
        c.respond(0, true);
        assert_eq!(advance(&mut c, 280, [600., 910., 0.], true), vec![1]);
        assert!(advance(&mut c, 19, [600., 910., 0.], true).is_empty());
        assert_eq!(c.tick(1., [600., 910., 0.], true, true), Some(0));
    }
}
