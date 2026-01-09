import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { NotificationService } from './shared/services/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Meme Manager';

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    // Demander la permission pour les notifications navigateur
    this.notificationService.requestNotificationPermission();
  }
}
