import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SocialSidebarComponent } from './components/social-sidebar/social-sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SocialSidebarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}
